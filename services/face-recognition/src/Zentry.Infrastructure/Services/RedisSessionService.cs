using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Models;

namespace Zentry.Infrastructure.Services;

/// <summary>
///     Redis-based implementation của ISessionService
/// </summary>
public class RedisSessionService : ISessionService
{
    private readonly ILogger<RedisSessionService> _logger;
    private readonly IDatabase _redis;

    public RedisSessionService(IConnectionMultiplexer redis, ILogger<RedisSessionService> logger)
    {
        _redis = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<string> CreateSessionAsync(Guid userId, Guid deviceId, TimeSpan expiration)
    {
        try
        {
            // Tạo session key unique
            var sessionKey = $"session_{Guid.NewGuid():N}";

            // Tạo session data
            var sessionData = new SessionData(
                userId,
                deviceId,
                DateTime.UtcNow,
                DateTime.UtcNow.Add(expiration)
            );

            var sessionJson = JsonSerializer.Serialize(sessionData);

            // Lưu session với TTL
            await _redis.StringSetAsync(sessionKey, sessionJson, expiration);

            // Lưu mapping user -> session để revoke
            var userSessionKey = $"user_session:{userId}";
            await _redis.StringSetAsync(userSessionKey, sessionKey, expiration);

            // Lưu mapping device -> session
            var deviceSessionKey = $"device_session:{deviceId}";
            await _redis.StringSetAsync(deviceSessionKey, sessionKey, expiration);

            _logger.LogInformation(
                "Created session {SessionKey} for user {UserId} device {DeviceId} expires at {ExpiresAt}",
                sessionKey, userId, deviceId, sessionData.ExpiresAt);

            return sessionKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating session for user {UserId} device {DeviceId}", userId, deviceId);
            throw;
        }
    }

    public async Task<bool> ValidateSessionAsync(string sessionKey, Guid deviceId)
    {
        try
        {
            var sessionData = await _redis.StringGetAsync(sessionKey);
            if (!sessionData.HasValue || string.IsNullOrEmpty(sessionData.ToString()))
            {
                _logger.LogWarning("Session {SessionKey} not found", sessionKey);
                return false;
            }

            var session = JsonSerializer.Deserialize<SessionData>(sessionData.ToString());
            if (session == null)
            {
                _logger.LogWarning("Failed to deserialize session {SessionKey}", sessionKey);
                return false;
            }

            // Kiểm tra deviceId có khớp không
            if (session.DeviceId != deviceId)
            {
                _logger.LogWarning(
                    "Device mismatch for session {SessionKey}. Expected: {ExpectedDevice}, Actual: {ActualDevice}",
                    sessionKey, session.DeviceId, deviceId);
                return false;
            }

            // Kiểm tra session có expired không
            if (session.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogInformation("Session {SessionKey} expired at {ExpiresAt}", sessionKey, session.ExpiresAt);
                await RevokeSessionAsync(sessionKey);
                return false;
            }

            _logger.LogDebug("Session {SessionKey} validated successfully for device {DeviceId}", sessionKey, deviceId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating session {SessionKey} for device {DeviceId}", sessionKey, deviceId);
            return false;
        }
    }

    public async Task<bool> RevokeSessionAsync(string sessionKey)
    {
        try
        {
            var sessionData = await _redis.StringGetAsync(sessionKey);
            if (!sessionData.HasValue || string.IsNullOrEmpty(sessionData.ToString()))
            {
                _logger.LogWarning("Session {SessionKey} not found for revocation", sessionKey);
                return false;
            }

            var session = JsonSerializer.Deserialize<SessionData>(sessionData.ToString());
            if (session != null)
            {
                // Xóa tất cả related keys
                await _redis.KeyDeleteAsync(sessionKey);
                await _redis.KeyDeleteAsync($"user_session:{session.UserId}");
                await _redis.KeyDeleteAsync($"device_session:{session.DeviceId}");

                _logger.LogInformation("Revoked session {SessionKey} for user {UserId} device {DeviceId}",
                    sessionKey, session.UserId, session.DeviceId);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking session {SessionKey}", sessionKey);
            return false;
        }
    }

    public async Task<bool> RevokeAllUserSessionsAsync(Guid userId)
    {
        try
        {
            var userSessionKey = $"user_session:{userId}";
            var sessionKey = await _redis.StringGetAsync(userSessionKey);

            if (sessionKey.HasValue && !string.IsNullOrEmpty(sessionKey.ToString()))
                await RevokeSessionAsync(sessionKey.ToString());

            _logger.LogInformation("Revoked all sessions for user {UserId}", userId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error revoking all sessions for user {UserId}", userId);
            return false;
        }
    }

    public async Task<Guid?> GetUserIdFromSessionAsync(string sessionKey)
    {
        try
        {
            var sessionData = await _redis.StringGetAsync(sessionKey);
            if (!sessionData.HasValue || string.IsNullOrEmpty(sessionData.ToString()))
                return null;

            var session = JsonSerializer.Deserialize<SessionData>(sessionData.ToString());
            return session?.UserId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user ID from session {SessionKey}", sessionKey);
            return null;
        }
    }

    public async Task<Guid?> GetDeviceIdFromSessionAsync(string sessionKey)
    {
        try
        {
            var sessionData = await _redis.StringGetAsync(sessionKey);
            if (!sessionData.HasValue || string.IsNullOrEmpty(sessionData.ToString()))
                return null;

            var session = JsonSerializer.Deserialize<SessionData>(sessionData.ToString());
            return session?.DeviceId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device ID from session {SessionKey}", sessionKey);
            return null;
        }
    }

    public async Task<bool> HasActiveSessionAsync(Guid userId)
    {
        try
        {
            var userSessionKey = $"user_session:{userId}";
            var sessionKey = await _redis.StringGetAsync(userSessionKey);

            if (!sessionKey.HasValue || string.IsNullOrEmpty(sessionKey.ToString()))
                return false;

            // Kiểm tra session có expired không
            var sessionData = await _redis.StringGetAsync(sessionKey.ToString());
            if (!sessionData.HasValue || string.IsNullOrEmpty(sessionData.ToString()))
                return false;

            var session = JsonSerializer.Deserialize<SessionData>(sessionData.ToString());
            return session?.ExpiresAt > DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking active session for user {UserId}", userId);
            return false;
        }
    }
}