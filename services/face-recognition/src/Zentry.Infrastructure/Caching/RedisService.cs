using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Zentry.Infrastructure.Caching;

public class RedisService : IRedisService
{
    private readonly IDatabase _database;
    private readonly ILogger<RedisService> _logger;

    public RedisService(IConnectionMultiplexer redisConnection, ILogger<RedisService> logger)
    {
        _logger = logger;
        try
        {
            _database = redisConnection.GetDatabase();
            _logger.LogInformation("RedisService initialized. Connected to Redis.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize RedisService with existing ConnectionMultiplexer.");
            throw;
        }
    }

    public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        try
        {
            var jsonValue = JsonSerializer.Serialize(value);
            return await _database.StringSetAsync(key, jsonValue, expiry);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to set Redis key '{Key}'.", key);
            return false;
        }
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var redisValue = await _database.StringGetAsync(key);
            if (redisValue.IsNullOrEmpty) return default;
            return JsonSerializer.Deserialize<T>(redisValue!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get Redis key '{Key}'.", key);
            return default;
        }
    }

    public async Task<bool> KeyExistsAsync(string key)
    {
        try
        {
            return await _database.KeyExistsAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check existence of Redis key '{Key}'.", key);
            return false;
        }
    }

    public async Task<bool> RemoveAsync(string key)
    {
        try
        {
            return await _database.KeyDeleteAsync(key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to remove Redis key '{Key}'.", key);
            return false;
        }
    }
}