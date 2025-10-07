namespace Zentry.Modules.DeviceManagement.Abstractions;

public interface IUserDeviceService
{
    Task<bool> CheckUserExistsAsync(Guid userId, CancellationToken cancellationToken);
}