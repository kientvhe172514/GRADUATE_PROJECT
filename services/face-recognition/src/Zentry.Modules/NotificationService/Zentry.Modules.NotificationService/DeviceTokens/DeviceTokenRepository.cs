using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.SharedKernel.Contracts.Device;

namespace Zentry.Modules.NotificationService.Infrastructure.DeviceTokens;

/// <summary>
///     Real implementation of IDeviceTokenRepository that integrates with DeviceManagement module
///     to get actual push notification tokens instead of using mock data
/// </summary>
public class DeviceTokenRepository : IDeviceTokenRepository
{
    private readonly ILogger<DeviceTokenRepository> _logger;
    private readonly IMediator _mediator;

    public DeviceTokenRepository(IMediator mediator, ILogger<DeviceTokenRepository> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<IReadOnlyList<string>> GetTokensByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Getting push notification tokens for user {UserId}", userId);

            // Query DeviceManagement module to get push notification tokens
            var query = new GetDevicePushTokensIntegrationQuery(userId);
            var response = await _mediator.Send(query, cancellationToken);

            _logger.LogInformation("Found {TokenCount} push notification tokens for user {UserId}",
                response.PushNotificationTokens.Count, userId);

            return response.PushNotificationTokens;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting push notification tokens for user {UserId}", userId);

            // Return empty list instead of throwing to prevent notification failures
            // from breaking the entire notification flow
            return new List<string>().AsReadOnly();
        }
    }

    public async Task RemoveTokensAsync(List<string> tokens, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Request to remove {TokenCount} invalid push notification tokens", tokens.Count);

            // TODO: Implement integration with DeviceManagement to mark tokens as invalid
            // For now, just log the invalid tokens
            foreach (var token in tokens)
                _logger.LogWarning("Invalid push notification token detected: {Token}",
                    token?.Substring(0, Math.Min(10, token.Length)) + "...");

            // TODO: Create RemoveInvalidDeviceTokensIntegrationCommand in SharedKernel.Contracts.Device
            // and implement handler in DeviceManagement module

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing invalid push notification tokens");
        }
    }
}

/// <summary>
///     Interface for device token repository
/// </summary>
public interface IDeviceTokenRepository
{
    Task<IReadOnlyList<string>> GetTokensByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task RemoveTokensAsync(List<string> tokens, CancellationToken cancellationToken);
}