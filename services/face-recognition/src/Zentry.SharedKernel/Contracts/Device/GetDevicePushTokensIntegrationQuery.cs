using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Device;

/// <summary>
///     Integration query to get push notification tokens for a specific user
///     Used by NotificationService to get device tokens from DeviceManagement module
/// </summary>
public record GetDevicePushTokensIntegrationQuery(Guid UserId)
    : IQuery<GetDevicePushTokensIntegrationResponse>;

/// <summary>
///     Response containing list of active push notification tokens for the requested user
/// </summary>
public record GetDevicePushTokensIntegrationResponse(
    IReadOnlyList<string> PushNotificationTokens
);