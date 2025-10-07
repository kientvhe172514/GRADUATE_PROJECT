namespace Zentry.SharedKernel.Abstractions.Application;

/// <summary>
///     Service để quản lý session thay thế JWT
/// </summary>
public interface ISessionService
{
    /// <summary>
    ///     Tạo session mới cho user và device
    /// </summary>
    Task<string> CreateSessionAsync(Guid userId, Guid deviceId, TimeSpan expiration);

    /// <summary>
    ///     Validate session key và device
    /// </summary>
    Task<bool> ValidateSessionAsync(string sessionKey, Guid deviceId);

    /// <summary>
    ///     Revoke session cụ thể
    /// </summary>
    Task<bool> RevokeSessionAsync(string sessionKey);

    /// <summary>
    ///     Revoke tất cả session của user
    /// </summary>
    Task<bool> RevokeAllUserSessionsAsync(Guid userId);

    /// <summary>
    ///     Lấy UserId từ session key
    /// </summary>
    Task<Guid?> GetUserIdFromSessionAsync(string sessionKey);

    /// <summary>
    ///     Lấy DeviceId từ session key
    /// </summary>
    Task<Guid?> GetDeviceIdFromSessionAsync(string sessionKey);

    /// <summary>
    ///     Kiểm tra user có active session không
    /// </summary>
    Task<bool> HasActiveSessionAsync(Guid userId);
}