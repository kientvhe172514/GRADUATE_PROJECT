using Microsoft.EntityFrameworkCore;
using Zentry.Modules.NotificationService.Entities;

namespace Zentry.Modules.NotificationService.Persistence.Repository;

public class NotificationRepository(NotificationDbContext dbContext) : INotificationRepository
{
    public async Task AddAsync(Notification notification, CancellationToken cancellationToken)
    {
        await dbContext.Notifications.AddAsync(notification, cancellationToken);
    }

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Notifications.FindAsync([id], cancellationToken);
    }

    public async Task<IEnumerable<Notification>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Notifications
            .Where(n => n.RecipientUserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Notification>> GetUnreadByUserIdAsync(Guid userId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Notifications
            .Where(n => n.RecipientUserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetCountByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Notifications
            .CountAsync(n => n.RecipientUserId == userId, cancellationToken);
    }

    public async Task<int> GetUnreadCountByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await dbContext.Notifications
            .CountAsync(n => n.RecipientUserId == userId && !n.IsRead, cancellationToken);
    }

    public async Task UpdateAsync(Notification notification, CancellationToken cancellationToken)
    {
        dbContext.Notifications.Update(notification);
    }

    public async Task UpdateRangeAsync(IEnumerable<Notification> notifications, CancellationToken cancellationToken)
    {
        dbContext.Notifications.UpdateRange(notifications);
    }

    public async Task DeleteAsync(Notification notification, CancellationToken cancellationToken)
    {
        dbContext.Notifications.Remove(notification);
    }

    public async Task DeleteRangeAsync(IEnumerable<Notification> notifications, CancellationToken cancellationToken)
    {
        dbContext.Notifications.RemoveRange(notifications);
    }

    public async Task<bool> SaveChangesAsync(CancellationToken cancellationToken)
    {
        return await dbContext.SaveChangesAsync(cancellationToken) > 0;
    }
}