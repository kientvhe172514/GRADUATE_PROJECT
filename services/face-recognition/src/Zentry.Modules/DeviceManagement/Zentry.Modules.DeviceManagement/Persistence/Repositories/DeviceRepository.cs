using Microsoft.EntityFrameworkCore;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.Modules.DeviceManagement.Dtos;
using Zentry.Modules.DeviceManagement.Entities;
using Zentry.Modules.DeviceManagement.ValueObjects;
using Zentry.SharedKernel.Constants.Device;

namespace Zentry.Modules.DeviceManagement.Persistence.Repositories;

public class DeviceRepository(DeviceDbContext dbContext) : IDeviceRepository
{
    public async Task<int> CountAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Devices.CountAsync(cancellationToken);
    }

    public async Task<int> CountByStatusAsync(DeviceStatus status, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .CountAsync(d => d.Status == status, cancellationToken);
    }

    public async Task<Device?> GetActiveDeviceForUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Status == DeviceStatus.Active, cancellationToken);
    }

    public async Task<Device?> GetPendingDeviceForUserAsync(Guid userId, Guid deviceId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Id == deviceId && d.Status == DeviceStatus.Pending,
                cancellationToken);
    }

    public async Task<int> CountAllByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .CountAsync(d => d.UserId == userId, cancellationToken);
    }

    public async Task<Device?> GetUserActiveDeviceAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .FirstOrDefaultAsync(d => d.UserId == userId && d.Status == DeviceStatus.Active, cancellationToken);
    }

    public async Task<(IEnumerable<DeviceListItemDto> Devices, int TotalCount)> GetDevicesAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm,
        Guid? userId,
        DeviceStatus? status,
        CancellationToken cancellationToken)
    {
        IQueryable<Device> query = dbContext.Devices;

        if (userId.HasValue) query = query.Where(d => d.UserId == userId.Value);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(d =>
                d.DeviceName.Value.Contains(lowerSearchTerm) ||
                d.AndroidId.Value.Contains(lowerSearchTerm));
        }

        if (status != null) query = query.Where(d => d.Status == status);

        var totalCount = await query.CountAsync(cancellationToken);

        var devices = await query
            .OrderBy(d => d.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DeviceListItemDto
            {
                DeviceId = d.Id,
                UserId = d.UserId,
                DeviceName = d.DeviceName.Value,
                AndroidId = d.AndroidId.Value,
                Platform = d.Platform,
                OsVersion = d.OsVersion,
                Model = d.Model,
                Manufacturer = d.Manufacturer,
                AppVersion = d.AppVersion,
                PushNotificationToken = d.PushNotificationToken,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt,
                LastVerifiedAt = d.LastVerifiedAt,
                Status = d.Status.ToString()
            })
            .ToListAsync(cancellationToken);

        return (devices, totalCount);
    }

    public async Task<List<Device>> GetByIdsAsync(List<Guid> deviceIds, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .Where(d => deviceIds.Contains(d.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<Guid?> GetActiveDeviceByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .AsNoTracking()
            .Where(d => d.UserId == userId && d.Status == DeviceStatus.Active)
            .Select(d => (Guid?)d.Id)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<Device>> GetActiveDevicesByUserIdsAsync(List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .AsNoTracking()
            .Where(d => userIds.Contains(d.UserId) && d.Status == DeviceStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Device>> GetUserIdsByDeviceIdsAsync(List<Guid> deviceIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .AsNoTracking()
            .Where(d => deviceIds.Contains(d.Id) && d.Status == DeviceStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<Device?> GetByAndroidIdAsync(string androidId, CancellationToken cancellationToken)
    {
        var androidIdObject = AndroidId.Create(androidId);

        return await dbContext.Devices
            .AsNoTracking()
            .FirstOrDefaultAsync(d => (string)d.AndroidId == androidIdObject.Value, cancellationToken);
    }

    public async Task<(Guid DeviceId, Guid UserId)?> GetDeviceAndUserIdByAndroidIdAsync(string androidId,
        CancellationToken cancellationToken)
    {
        var androidIdObject = AndroidId.Create(androidId);

        var result = await dbContext.Devices
            .AsNoTracking()
            .Where(d => (string)d.AndroidId == androidIdObject.Value && d.Status == DeviceStatus.Active)
            .Select(d => new { d.Id, d.UserId })
            .FirstOrDefaultAsync(cancellationToken);

        return result != null ? (result.Id, result.UserId) : null;
    }

    public async Task<List<Device>> GetActiveDevicesByAndroidIdsAsync(List<string> androidIds,
        CancellationToken cancellationToken)
    {
        var normalizedAndroidIds = androidIds.Select(a => AndroidId.Create(a).Value).ToList();

        return await dbContext.Devices
            .AsNoTracking()
            .Where(d => normalizedAndroidIds.Contains((string)d.AndroidId) && d.Status == DeviceStatus.Active)
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<string, (Guid DeviceId, Guid UserId)>> GetDeviceAndUserIdsByAndroidIdsAsync(
        List<string> androidIds, CancellationToken cancellationToken)
    {
        var normalizedAndroidIds = androidIds.Select(a => AndroidId.Create(a).Value).ToList();

        var results = await dbContext.Devices
            .AsNoTracking()
            .Where(d => normalizedAndroidIds.Contains(d.AndroidId) && d.Status == DeviceStatus.Active)
            .Select(d => new { AndroidIdValue = (string)d.AndroidId, d.Id, d.UserId })
            .ToListAsync(cancellationToken);

        return results.ToDictionary(
            r => r.AndroidIdValue,
            r => (r.Id, r.UserId)
        );
    }

    public async Task AddAsync(Device device)
    {
        await dbContext.Devices.AddAsync(device);
    }

    public async Task AddRangeAsync(IEnumerable<Device> entities, CancellationToken cancellationToken)
    {
        await dbContext.Devices.AddRangeAsync(entities, cancellationToken);
    }

    public Task DeleteAsync(Device entity, CancellationToken cancellationToken)
    {
        throw new NotSupportedException("Use Soft delete please.");
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Device>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Devices.ToListAsync(cancellationToken);
    }

    public async Task<Device?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Devices.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task AddAsync(Device entity, CancellationToken cancellationToken)
    {
        await dbContext.Devices.AddAsync(entity, cancellationToken);
    }

    public async Task UpdateAsync(Device entity, CancellationToken cancellationToken)
    {
        dbContext.Devices.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<Device>> GetByAccountIdAsync(Guid accountId, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .Where(d => d.UserId == accountId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Device?> GetByDeviceTokenAsync(string deviceToken, CancellationToken cancellationToken)
    {
        return await dbContext.Devices
            .FirstOrDefaultAsync(d => d.DeviceToken.Value == deviceToken, cancellationToken);
    }

    public async Task DeleteRangeAsync(IEnumerable<Device> entities, CancellationToken cancellationToken)
    {
        dbContext.Devices.RemoveRange(entities);
        await SaveChangesAsync(cancellationToken);
    }
}