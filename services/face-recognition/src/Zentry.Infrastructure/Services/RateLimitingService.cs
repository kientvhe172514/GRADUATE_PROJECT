using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace Zentry.Infrastructure.Services;

/// <summary>
///     Service để implement rate limiting
/// </summary>
public class RateLimitingService : IRateLimitingService
{
    private readonly ILogger<RateLimitingService> _logger;
    private readonly IDatabase _redis;

    public RateLimitingService(IConnectionMultiplexer redis, ILogger<RateLimitingService> logger)
    {
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<bool> CheckRateLimitAsync(string key, int maxAttempts, TimeSpan window)
    {
        try
        {
            var currentCount = await _redis.StringGetAsync(key);
            var count = currentCount.HasValue ? int.Parse(currentCount) : 0;

            if (count >= maxAttempts)
            {
                _logger.LogWarning("Rate limit exceeded for key {Key}. Current: {Count}, Max: {Max}", key, count,
                    maxAttempts);
                return false;
            }

            await _redis.StringIncrementAsync(key);
            if (count == 0) await _redis.KeyExpireAsync(key, window);

            _logger.LogDebug("Rate limit check passed for key {Key}. Current: {Count}, Max: {Max}", key, count + 1,
                maxAttempts);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit for key {Key}", key);
            return false; // Fail safe - allow request if rate limiting fails
        }
    }

    public async Task<bool> CheckDeviceChangeRateLimitAsync(Guid userId)
    {
        var key = $"device_change_limit:{userId}";
        var maxAttempts = 1; // Chỉ cho phép 1 lần/tháng
        var window = TimeSpan.FromDays(30);

        return await CheckRateLimitAsync(key, maxAttempts, window);
    }

    public async Task<bool> CheckLoginRateLimitAsync(string email)
    {
        var key = $"login_limit:{email}";
        var maxAttempts = 5; // Cho phép 5 lần/giờ
        var window = TimeSpan.FromHours(1);

        return await CheckRateLimitAsync(key, maxAttempts, window);
    }

    public async Task ResetRateLimitAsync(string key)
    {
        try
        {
            await _redis.KeyDeleteAsync(key);
            _logger.LogDebug("Reset rate limit for key {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting rate limit for key {Key}", key);
        }
    }
}

public interface IRateLimitingService
{
    Task<bool> CheckRateLimitAsync(string key, int maxAttempts, TimeSpan window);
    Task<bool> CheckDeviceChangeRateLimitAsync(Guid userId);
    Task<bool> CheckLoginRateLimitAsync(string email);
    Task ResetRateLimitAsync(string key);
}