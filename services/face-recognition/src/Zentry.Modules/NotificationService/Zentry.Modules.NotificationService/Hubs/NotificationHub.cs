using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Zentry.Modules.NotificationService.Hubs;

/// <summary>
///     SignalR Hub cho real-time notifications
/// </summary>
public class NotificationHub : Hub
{
    private readonly ILogger<NotificationHub> _logger;

    public NotificationHub(ILogger<NotificationHub> logger)
    {
        _logger = logger;
    }

    /// <summary>
    ///     User join vào group để nhận notifications
    /// </summary>
    public async Task JoinUserGroup(string userId)
    {
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Attempted to join user group with empty userId");
            return;
        }

        var groupName = GetUserGroupName(userId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("User {UserId} joined notification group with connection {ConnectionId}",
            userId, Context.ConnectionId);
    }

    /// <summary>
    ///     User leave group khi disconnect
    /// </summary>
    public async Task LeaveUserGroup(string userId)
    {
        if (string.IsNullOrEmpty(userId)) return;

        var groupName = GetUserGroupName(userId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("User {UserId} left notification group", userId);
    }

    /// <summary>
    ///     Handle connection disconnect
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Connection {ConnectionId} disconnected", Context.ConnectionId);

        if (exception != null)
            _logger.LogError(exception, "Connection {ConnectionId} disconnected with error", Context.ConnectionId);

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    ///     Handle connection connect
    /// </summary>
    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("New connection established: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    /// <summary>
    ///     Get standardized user group name
    /// </summary>
    private static string GetUserGroupName(string userId)
    {
        return $"user_{userId}";
    }
}