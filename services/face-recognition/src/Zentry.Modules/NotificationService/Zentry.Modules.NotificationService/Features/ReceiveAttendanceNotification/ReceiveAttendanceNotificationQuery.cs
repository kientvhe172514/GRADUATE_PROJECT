using MediatR;
using Zentry.Modules.NotificationService.Entities;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.NotificationService.Features.ReceiveAttendanceNotification;

public record ReceiveAttendanceNotificationServiceQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 10) : IQuery<List<Notification>>, IRequest<List<Notification>>;