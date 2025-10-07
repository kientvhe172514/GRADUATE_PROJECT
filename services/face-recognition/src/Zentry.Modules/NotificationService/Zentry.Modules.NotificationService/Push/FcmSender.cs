using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Zentry.Modules.NotificationService.Infrastructure.DeviceTokens;

namespace Zentry.Modules.NotificationService.Infrastructure.Push;

/// <summary>
///     Gửi push notification sử dụng Firebase Cloud Messaging.
/// </summary>
public class FcmSender : IFcmSender
{
    private readonly IConfiguration _configuration;
    private readonly IDeviceTokenRepository _deviceTokenRepository;
    private readonly ILogger<FcmSender> _logger;

    public FcmSender(ILogger<FcmSender> logger,
        IDeviceTokenRepository deviceTokenRepository,
        IConfiguration configuration)
    {
        _logger = logger;
        _deviceTokenRepository = deviceTokenRepository;
        _configuration = configuration;

        // Initialize Firebase Admin SDK
        InitializeFirebase();
    }

    /// <summary>
    ///     Kiểm tra trạng thái Firebase initialization
    /// </summary>
    public bool IsFirebaseInitialized { get; private set; }

    public async Task SendPushNotificationAsync(Guid recipientUserId, string title, string body,
        IReadOnlyDictionary<string, string>? data, CancellationToken cancellationToken)
    {
        // Check if Firebase is initialized
        if (!IsFirebaseInitialized || FirebaseApp.DefaultInstance == null)
        {
            _logger.LogWarning("Firebase not initialized. Skipping push notification for user {UserId}",
                recipientUserId);
            return;
        }

        var fcmTokens = await _deviceTokenRepository.GetTokensByUserIdAsync(recipientUserId, cancellationToken);
        if (!fcmTokens.Any())
        {
            _logger.LogWarning("No FCM tokens found for user {UserId}. Skipping push notification.", recipientUserId);
            return;
        }

        _logger.LogInformation("Sending push notification to {TokenCount} devices for user {UserId}",
            fcmTokens.Count, recipientUserId);

        var message = new MulticastMessage
        {
            Tokens = fcmTokens,
            Notification = new Notification
            {
                Title = title,
                Body = body
            },
            Data = data,
            Apns = new ApnsConfig
            {
                Aps = new Aps
                {
                    Sound = "default",
                    Badge = 1
                }
            },
            Android = new AndroidConfig
            {
                Priority = Priority.High,
                Notification = new AndroidNotification
                {
                    Sound = "default",
                    ChannelId = "zentry-notifications"
                }
            }
        };

        try
        {
            var response = await FirebaseMessaging.DefaultInstance.SendMulticastAsync(message, cancellationToken);

            if (response.SuccessCount > 0)
                _logger.LogInformation(
                    "Successfully sent push notification to {SuccessCount} tokens for user {UserId}.",
                    response.SuccessCount, recipientUserId);

            if (response.FailureCount > 0)
            {
                var failedTokens = new List<string>();
                for (var i = 0; i < response.Responses.Count; i++)
                    if (!response.Responses[i].IsSuccess)
                    {
                        failedTokens.Add(fcmTokens[i]);
                        _logger.LogWarning("Failed to send to token {Token}: {Error}",
                            fcmTokens[i].Substring(0, Math.Min(10, fcmTokens[i].Length)) + "...",
                            response.Responses[i].Exception?.Message ?? "Unknown error");
                    }

                _logger.LogError(
                    "Failed to send push notification to {FailureCount} tokens for user {UserId}. Failed tokens: {FailedTokens}",
                    response.FailureCount, recipientUserId, string.Join(", ", failedTokens));

                // Remove invalid tokens
                if (failedTokens.Any())
                {
                    await _deviceTokenRepository.RemoveTokensAsync(failedTokens, cancellationToken);
                    _logger.LogInformation("Removed {Count} invalid FCM tokens", failedTokens.Count);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while sending push notification for user {UserId}",
                recipientUserId);
            throw;
        }
    }

    private void InitializeFirebase()
    {
        try
        {
            if (FirebaseApp.DefaultInstance == null)
            {
                // Sử dụng file zentry.json từ thư mục firebase-credentials
                var credentialsPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "firebase-credentials",
                    "zentry.json"
                );

                if (File.Exists(credentialsPath))
                {
                    _logger.LogInformation("Found Firebase credentials file at: {Path}", credentialsPath);

                    var credential = GoogleCredential.FromFile(credentialsPath);
                    FirebaseApp.Create(new AppOptions
                    {
                        Credential = credential,
                        ProjectId = "zentry-3e121" // Lấy từ file config
                    });

                    IsFirebaseInitialized = true;
                    _logger.LogInformation("Firebase Admin SDK initialized successfully with zentry.json");
                }
                else
                {
                    // Fallback: Sử dụng environment variables nếu có
                    var projectId = _configuration["Firebase:ProjectId"];
                    var privateKey = _configuration["Firebase:PrivateKey"]?.Replace("\\n", "\n");
                    var clientEmail = _configuration["Firebase:ClientEmail"];

                    if (!string.IsNullOrEmpty(projectId) && !string.IsNullOrEmpty(privateKey) &&
                        !string.IsNullOrEmpty(clientEmail))
                    {
                        // Sử dụng GoogleCredential với JSON string
                        var jsonConfig =
                            $"{{\"type\":\"service_account\",\"project_id\":\"{projectId}\",\"private_key\":\"{privateKey}\",\"client_email\":\"{clientEmail}\"}}";
                        var credential = GoogleCredential.FromJson(jsonConfig);

                        FirebaseApp.Create(new AppOptions
                        {
                            Credential = credential,
                            ProjectId = projectId
                        });

                        IsFirebaseInitialized = true;
                        _logger.LogInformation("Firebase Admin SDK initialized with environment variables");
                    }
                    else
                    {
                        _logger.LogWarning("Firebase credentials not found. Push notifications will be disabled.");
                        _logger.LogWarning("Expected file: {Path}", credentialsPath);
                        _logger.LogWarning(
                            "Or set environment variables: Firebase__ProjectId, Firebase__PrivateKey, Firebase__ClientEmail");
                    }
                }
            }
            else
            {
                IsFirebaseInitialized = true;
                _logger.LogInformation("Firebase Admin SDK already initialized");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize Firebase Admin SDK");
            IsFirebaseInitialized = false;
            // Don't throw - app should still work without push notifications
        }
    }
}