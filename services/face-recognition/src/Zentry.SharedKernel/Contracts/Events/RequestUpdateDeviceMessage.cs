namespace Zentry.SharedKernel.Contracts.Events;

public record RequestUpdateDeviceMessage(
    Guid RequestedByUserId,
    Guid NewDeviceId,
    string RequestType,
    string Reason
);