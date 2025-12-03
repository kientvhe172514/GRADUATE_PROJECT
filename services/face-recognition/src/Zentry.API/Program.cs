using System.Text.Json;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using MassTransit;
using MediatR;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Polly;
using RabbitMQ.Client;
using Zentry.Infrastructure;
using Zentry.Infrastructure.Messaging.HealthCheck;
using Zentry.Infrastructure.Messaging.Heartbeat;
using Zentry.Modules.FaceId;
using Zentry.Modules.FaceId.Persistence;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Helpers;
using Zentry.SharedKernel.Middlewares;

var builder = WebApplication.CreateBuilder(args);

// ===== CẤU HÌNH RATE LIMITING =====
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("FixedPolicy", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });

    // Sliding Window Policy - Cho phép giới hạn linh hoạt hơn
    options.AddSlidingWindowLimiter("SlidingPolicy", opt =>
    {
        opt.PermitLimit = 50; // Cho phép tối đa 50 requests
        opt.Window = TimeSpan.FromMinutes(1); // Trong 1 phút
        opt.SegmentsPerWindow = 6; // Chia thành 6 segment (10 giây mỗi segment)
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });

    // Token Bucket Policy - Cho phép burst traffic
    options.AddTokenBucketLimiter("TokenPolicy", opt =>
    {
        opt.TokenLimit = 100; // Bucket chứa tối đa 100 tokens
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10); // Thêm token mỗi 10 giây
        opt.TokensPerPeriod = 20; // Thêm 20 tokens mỗi lần
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });

    options.AddConcurrencyLimiter("ConcurrencyPolicy", opt =>
    {
        opt.PermitLimit = 50;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 20;
    });

    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1)
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        var apiResponse = ApiResponse.ErrorResult(
            ErrorCodes.RateLimitExceeded,
            "Too many requests. Please try again later."
        );

        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(apiResponse),
            token
        );
    };
});

// ===== CẤU HÌNH CONTROLLERS VÀ JSON =====
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
        options.JsonSerializerOptions.Converters.Add(new DateTimeToLocalConverter());
        options.JsonSerializerOptions.Converters.Add(new NullableDateTimeToLocalConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Face Recognition API",
        Version = "v1",
        Description = "Face ID registration, verification and face verification request management"
    });
    
    options.CustomSchemaIds(type => type.FullName);

    // Only include FaceId controllers
    options.DocInclusionPredicate((docName, apiDesc) =>
    {
        var controllerName = apiDesc.ActionDescriptor.RouteValues["controller"];
        return controllerName != null && 
               (controllerName.Contains("FaceId", StringComparison.OrdinalIgnoreCase) ||
                controllerName.Contains("FaceVerification", StringComparison.OrdinalIgnoreCase));
    });

    // Load XML comments
    var basePath = AppContext.BaseDirectory;
    var xmlFiles = Directory.GetFiles(basePath, "*.xml");
    foreach (var xmlFile in xmlFiles)
    {
        options.IncludeXmlComments(xmlFile);
    }
});

builder.Services.AddFluentValidationAutoValidation(config => { config.DisableDataAnnotationsValidation = true; });
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ===== CẤU HÌNH MODEL VALIDATION =====
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState
            .SelectMany(x => x.Value?.Errors!)
            .FirstOrDefault();

        var message = firstError?.ErrorMessage ?? ErrorMessages.InvalidDataFormat;

        if (IsGuidFormatError(firstError?.ErrorMessage)) message = ErrorMessages.GuidFormatInvalid;

        var apiResponse = ApiResponse.ErrorResult(ErrorCodes.ValidationError, message);
        return new BadRequestObjectResult(apiResponse);
    };
});

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblies(AppDomain.CurrentDomain.GetAssemblies());
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
});
builder.Services.AddValidatorsFromAssemblies(AppDomain.CurrentDomain.GetAssemblies());

// ===== CẤU HÌNH CORS =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", corsPolicyBuilder =>
        corsPolicyBuilder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

builder.Services.AddAuthorization();

// --- Thêm health check ---
builder.Services.AddHealthChecks();

// Debug: Check ALL RabbitMQ-related env vars
Console.WriteLine("=== RabbitMQ Environment Variables Debug ===");
foreach (var kvp in builder.Configuration.AsEnumerable()
             .Where(x => x.Key.Contains("RabbitMQ", StringComparison.OrdinalIgnoreCase)))
{
    Console.WriteLine($"{kvp.Key} = {kvp.Value}");
}

// Only add RabbitMQ health check if connection string is configured
var rabbitMqHealthCheckConnStr = builder.Configuration["RabbitMQ:ConnectionString"];
Console.WriteLine($"🔍 Reading RabbitMQ:ConnectionString = {rabbitMqHealthCheckConnStr}");

if (!string.IsNullOrEmpty(rabbitMqHealthCheckConnStr))
{
    // 🔧 FIX: URL-encode password nếu chưa được encode
    rabbitMqHealthCheckConnStr = FixRabbitMqConnectionString(rabbitMqHealthCheckConnStr);
    
    builder.Services.AddRabbitMqHealthChecks(rabbitMqHealthCheckConnStr);
    Console.WriteLine("✅ RabbitMQ health checks added");
}
else
{
    Console.WriteLine("⚠️  RabbitMQ:ConnectionString not found, skipping RabbitMQ health checks");
}

// ===== RAW RABBITMQ CLIENT (for Direct Reply-To) =====
builder.Services.AddSingleton<IConnectionFactory>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var rabbitMqHost = configuration["RabbitMQ:Host"] ?? "localhost";
    var rabbitMqPort = int.Parse(configuration["RabbitMQ:Port"] ?? "5672");
    var rabbitMqUser = configuration["RabbitMQ:User"] ?? "guest";
    var rabbitMqPassword = configuration["RabbitMQ:Password"] ?? "guest";
    
    return new ConnectionFactory
    {
        HostName = rabbitMqHost,
        Port = rabbitMqPort,
        UserName = rabbitMqUser,
        Password = rabbitMqPassword,
        AutomaticRecoveryEnabled = true,
        NetworkRecoveryInterval = TimeSpan.FromSeconds(10)
    };
});
Console.WriteLine("✅ Raw RabbitMQ IConnectionFactory registered for Direct Reply-To");

// ===== CẤU HÌNH MASSTRANSIT =====
builder.Services.AddMassTransit(x =>
{
    x.AddHeartbeatConsumer();
    x.AddHealthCheckConsumer();
    x.AddFaceIdMassTransitConsumers(); // NEW HR attendance system

    x.UsingRabbitMq((context, cfg) =>
    {
        // ✅ Sử dụng configuration từ context thay vì builder
        var configuration = context.GetRequiredService<IConfiguration>();
        var rabbitMqConnectionString = configuration["RabbitMQ:ConnectionString"];

        // ✅ Debug logging để kiểm tra config
        Console.WriteLine("=== RabbitMQ Configuration Debug ===");
        Console.WriteLine($"RabbitMQ:ConnectionString (raw) = {rabbitMqConnectionString}");

        // Kiểm tra tất cả RabbitMQ keys
        foreach (var kvp in configuration.AsEnumerable()
                     .Where(x => x.Key.Contains("RabbitMQ", StringComparison.OrdinalIgnoreCase)))
            Console.WriteLine($"{kvp.Key} = {kvp.Value}");

        if (string.IsNullOrEmpty(rabbitMqConnectionString))
            throw new InvalidOperationException("RabbitMQ:ConnectionString is not configured.");

        // 🔧 FIX: URL-encode password nếu chưa được encode
        // Password có ký tự @ cần encode thành %40 để URI parser không confused
        rabbitMqConnectionString = FixRabbitMqConnectionString(rabbitMqConnectionString);
        Console.WriteLine($"RabbitMQ:ConnectionString (fixed) = {rabbitMqConnectionString}");

        cfg.Host(new Uri(rabbitMqConnectionString), h =>
        {
            // Cải thiện connection settings
            h.Heartbeat(TimeSpan.FromSeconds(30));
            h.RequestedConnectionTimeout(TimeSpan.FromSeconds(30));
            h.PublisherConfirmation = true;

            // Connection recovery
            h.RequestedChannelMax(100);
        });

        cfg.UseDelayedMessageScheduler();
        cfg.UseInMemoryOutbox(context);

        // ✅ Message serialization - Configure for NestJS compatibility
        // Use Raw JSON Serializer for plain JSON (no MassTransit envelope) with snake_case
        cfg.UseRawJsonSerializer(RawSerializerOptions.AddTransportHeaders);
        
        // Configure System.Text.Json options for snake_case property names
        cfg.ConfigureJsonSerializerOptions(options =>
        {
            options.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower; // ✅ snake_case for NestJS
            options.PropertyNameCaseInsensitive = true; // Accept both formats
            return options;
        });

        // Global retry policy
        cfg.UseMessageRetry(r =>
        {
            r.Exponential(10, TimeSpan.FromSeconds(1), TimeSpan.FromMinutes(5), TimeSpan.FromSeconds(2));
            r.Handle<TimeoutException>();
            r.Handle<InvalidOperationException>();
        });
        cfg.ConfigureHeartbeatEndpoint(context);
        cfg.ConfigureHealthCheckEndpoint(context);
        cfg.ConfigureFaceIdReceiveEndpoints(context); // NEW HR attendance face verification
    });
});

builder.Services.AddHostedService<RabbitMqWarmupService>();
builder.Services.AddMemoryCache();

// ===== FACE ID MODULE - Core Service =====
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddFaceIdInfrastructure(builder.Configuration);

ValidateConfiguration(builder.Configuration);

var app = builder.Build();

// Add global prefix to match other services: /api/v1/face
app.UsePathBase("/api/v1/face");
// ===== FILTER HEALTH CHECK LOGS =====
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower() ?? "";
    if (path.Contains("/health/") || path.Contains("/health"))
    {
        // Skip logging for health check endpoints
        await next();
    }
    else
    {
        await next();
    }
});

app.UseSwagger();
// Bật middleware để phục vụ trang giao diện Swagger UI
app.UseSwaggerUI(c =>
{   
     c.SwaggerEndpoint("/api/v1/face/swagger/v1/swagger.json", "Face Recognition API v1");
});
if (app.Environment.IsDevelopment())
{
    //app.UseDeveloperExceptionPage();
}
// ===== CẤU HÌNH MIDDLEWARE PIPELINE =====
app.UseCors("AllowAll");
app.UseHttpsRedirection();

app.UseRateLimiter();

app.UseValidationExceptionMiddleware();
app.UseAuthentication();
app.UseAuthorization();
// ✅ Thêm Device Validation Middleware - sử dụng factory pattern
// app.UseDeviceValidationMiddleware();
app.MapControllers();
// ❌ NotificationHub - Service notification riêng xử lý
// app.MapHub<NotificationHub>("/notificationHub");

// Cấu hình lại Health Checks
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready"),
    ResponseWriter = HealthCheckResponseWriter.WriteResponse
});
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = HealthCheckResponseWriter.WriteResponse
});

// ===== DATABASE MIGRATION CODE =====
await RunSelectiveDatabaseMigrationsAsync(app);

app.Run();

// ===== HELPER METHODS =====
static bool IsGuidFormatError(string? errorMessage)
{
    if (string.IsNullOrEmpty(errorMessage)) return false;

    return errorMessage.Contains("GUID", StringComparison.OrdinalIgnoreCase) ||
           errorMessage.Contains("is not valid", StringComparison.OrdinalIgnoreCase) ||
           errorMessage.Contains("format", StringComparison.OrdinalIgnoreCase);
}

// ✅ Method để chỉ drop các tables cần thiết
static async Task RunSelectiveDatabaseMigrationsAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var serviceProvider = scope.ServiceProvider;
    var environment = app.Environment;

    var retryPolicy = Policy
        .Handle<Exception>()
        .WaitAndRetryAsync(5, retryAttempt => TimeSpan.FromSeconds(5),
            (exception, timeSpan, retryCount, context) =>
            {
                logger.LogWarning(exception,
                    "Migration attempt {RetryCount} failed. Retrying in {TimeSpan} seconds...",
                    retryCount, timeSpan.TotalSeconds);
            });

    // ===== DATABASE CONTEXT - FACE ID ONLY =====
    var migrations = new[]
    {
        (typeof(FaceIdDbContext), "FaceIdDbContext")
    };

    foreach (var (contextType, contextName) in migrations)
    {
        await retryPolicy.ExecuteAsync(async () =>
        {
            var dbContext = (DbContext)serviceProvider.GetRequiredService(contextType);

            // SIMPLE SOLUTION: Just call MigrateAsync() - it does EVERYTHING automatically
            logger.LogInformation("[AUTO-MIGRATE] Running migrations for {ContextName}...", contextName);

            try
            {
                // MigrateAsync() automatically handles EVERYTHING:
                // 1. Creates DATABASE if missing
                // 2. Creates TABLES if missing
                // 3. Applies pending migrations
                // 4. Skips if already up-to-date
                await dbContext.Database.MigrateAsync();
                
                logger.LogInformation("[SUCCESS] {ContextName} database ready", contextName);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[FAILED] Migration error: {Message}", ex.Message);
                throw;
            }
        });
    }
}



static async Task DropContextTablesAsync(DbContext dbContext, ILogger logger, string contextName)
{
    try
    {
        var tableNames = dbContext.Model.GetEntityTypes()
            .Select(t => t.GetTableName())
            .Where(name => !string.IsNullOrEmpty(name))
            .ToList();

        foreach (var tableName in tableNames)
        {
            logger.LogInformation("Dropping table: {TableName} from {ContextName}", tableName, contextName);
            await dbContext.Database.ExecuteSqlRawAsync($"DROP TABLE IF EXISTS \"{tableName}\" CASCADE");
        }

        // Drop migration history table for this context
        var migrationTableName = $"__EFMigrationsHistory_{contextName}";
        await dbContext.Database.ExecuteSqlRawAsync($"DROP TABLE IF EXISTS \"{migrationTableName}\" CASCADE");

        logger.LogInformation("✅ All tables dropped for {ContextName}", contextName);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ Error dropping tables for {ContextName}", contextName);
        throw;
    }
}

static void ValidateConfiguration(IConfiguration configuration)
{
    // FaceIdConnection removed - code uses DefaultConnection for both databases
    var requiredConfigs = new[]
    {
        "ConnectionStrings:DefaultConnection",
        "Redis:ConnectionString",
        "RabbitMQ:ConnectionString",
        "Jwt:Secret"
    };

    var missingConfigs = new List<string>();

    foreach (var config in requiredConfigs)
    {
        var value = configuration[config];
        if (string.IsNullOrEmpty(value))
            missingConfigs.Add(config);
        else
            Console.WriteLine($"✅ {config} = {(config.Contains("Secret") ? "***HIDDEN***" : value)}");
    }

    if (missingConfigs.Any())
    {
        Console.WriteLine("❌ Missing required configurations:");
        missingConfigs.ForEach(config => Console.WriteLine($"  - {config}"));
        throw new InvalidOperationException($"Missing required configurations: {string.Join(", ", missingConfigs)}");
    }

    Console.WriteLine("✅ All required configurations are present.");
}

/// <summary>
/// Fix RabbitMQ connection string by URL-encoding password if needed.
/// Password with @ character needs to be encoded as %40 to avoid URI parsing errors.
/// </summary>
static string FixRabbitMqConnectionString(string connectionString)
{
    if (string.IsNullOrEmpty(connectionString))
        return connectionString;

    try
    {
        // Check if already encoded (contains %40 or other encoded chars)
        if (connectionString.Contains("%40") || connectionString.Contains("%"))
        {
            Console.WriteLine("🔍 Connection string already URL-encoded, skipping fix");
            return connectionString;
        }

        // Parse AMQP URI: amqp://username:password@host:port/vhost
        var uri = new UriBuilder(connectionString);
        
        // UserInfo format: "username:password"
        var userInfo = uri.UserName;
        var password = uri.Password;

        if (!string.IsNullOrEmpty(password))
        {
            // URL-encode password (will encode @ as %40, etc.)
            var encodedPassword = Uri.EscapeDataString(password);
            
            if (encodedPassword != password)
            {
                Console.WriteLine($"🔧 Encoding password: {password} → {encodedPassword}");
                uri.Password = encodedPassword;
                
                var fixedConnectionString = uri.ToString();
                Console.WriteLine($"✅ Fixed connection string created");
                return fixedConnectionString;
            }
        }

        return connectionString;
    }
    catch (UriFormatException)
    {
        // If URI parsing fails, try manual fix for common pattern
        // Pattern: amqp://username:password@host:port/
        // Password may contain @ character, so we need to match from LAST @
        Console.WriteLine("⚠️  URI parsing failed, trying manual password encoding...");
        
        // Match: amqp://username: + password + @host:port/
        // Using LastIndexOf to find the @ that separates password from host
        var amqpPrefix = "amqp://";
        if (!connectionString.StartsWith(amqpPrefix))
        {
            Console.WriteLine("❌ Not a valid AMQP connection string");
            return connectionString;
        }

        // Find the position of : after username (should be after "amqp://username")
        var firstColonPos = connectionString.IndexOf(':', amqpPrefix.Length);
        if (firstColonPos < 0)
        {
            Console.WriteLine("❌ Could not find password delimiter (:)");
            return connectionString;
        }

        // Find LAST @ in the string (this separates password from hostname)
        var lastAtPos = connectionString.LastIndexOf('@');
        if (lastAtPos <= firstColonPos)
        {
            Console.WriteLine("❌ Could not find host delimiter (@)");
            return connectionString;
        }

        // Extract parts
        var prefix = connectionString.Substring(0, firstColonPos + 1); // "amqp://username:"
        var password = connectionString.Substring(firstColonPos + 1, lastAtPos - firstColonPos - 1); // "password"
        var suffix = connectionString.Substring(lastAtPos); // "@host:port/"

        var encodedPassword = Uri.EscapeDataString(password);
        var fixedConnectionString = $"{prefix}{encodedPassword}{suffix}";
        
        Console.WriteLine($"🔧 Manual encoding: {password} → {encodedPassword}");
        Console.WriteLine($"✅ Fixed connection string: {fixedConnectionString}");
        
        return fixedConnectionString;
    }
}

public static class HealthCheckResponseWriter
{
    public static Task WriteResponse(HttpContext httpContext, HealthReport result)
    {
        httpContext.Response.ContentType = "application/json";
        var json = new
        {
            status = result.Status.ToString(),
            results = result.Entries.ToDictionary(
                entry => entry.Key,
                entry => new
                {
                    status = entry.Value.Status.ToString(),
                    description = entry.Value.Description,
                    data = entry.Value.Data
                })
        };
        return httpContext.Response.WriteAsync(
            JsonSerializer.Serialize(json, new JsonSerializerOptions { WriteIndented = true }));
    }
}
