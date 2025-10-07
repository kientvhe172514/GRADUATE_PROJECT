using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Attendance;

// Để dùng Date.Date

namespace Zentry.Modules.AttendanceManagement.Application.Integrations;

public class GetSessionByScheduleIdAndDateIntegrationQueryHandler(ISessionRepository sessionRepository)
    : IQueryHandler<GetSessionByScheduleIdAndDateIntegrationQuery, GetSessionByScheduleIdAndDateIntegrationResponse>
{
    public async Task<GetSessionByScheduleIdAndDateIntegrationResponse> Handle(
        GetSessionByScheduleIdAndDateIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        // Lấy session cho scheduleId và ngày cụ thể
        // Cần đảm bảo phương thức GetSessionByScheduleIdAndDateAsync có sẵn trong ISessionRepository
        // hoặc thêm nó vào.
        var session = await sessionRepository.GetSessionByScheduleIdAndDateAsync(
            query.ScheduleId,
            query.Date,
            cancellationToken);

        if (session is null) return null;

        // Ánh xạ từ Domain Entity (Session) sang DTO (Response)
        return new GetSessionByScheduleIdAndDateIntegrationResponse
        {
            SessionId = session.Id,
            Status = session.Status.ToString(),
            StartTime = session.StartTime, // Đảm bảo là UTC
            EndTime = session.EndTime // Đảm bảo là UTC
        };
    }
}