using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetCurrentWeekNumber;

public class GetCurrentWeekNumberQueryHandler(
    IScheduleRepository scheduleRepository
) : IQueryHandler<GetCurrentWeekNumberQuery, GetCurrentWeekNumberResponse>
{
    public async Task<GetCurrentWeekNumberResponse> Handle(
        GetCurrentWeekNumberQuery request,
        CancellationToken cancellationToken)
    {
        var response = new GetCurrentWeekNumberResponse
        {
            QueryDate = request.Date,
            IsInSession = false
        };

        var schedules =
            await scheduleRepository.GetSchedulesByDateAsync(request.Date, cancellationToken);

        if (schedules.Count == 0)
        {
            response.Message = "Không tìm thấy lịch học cho kì này";
            return response;
        }

        var earliestStartDate = schedules.Min(s => s.StartDate);
        var latestEndDate = schedules.Max(s => s.EndDate);

        response.EarliestStartDate = earliestStartDate;

        if (request.Date < earliestStartDate)
        {
            response.Message =
                $"Ngày {request.Date:yyyy-MM-dd} chưa bắt đầu kỳ học. Kỳ học bắt đầu từ {earliestStartDate:yyyy-MM-dd}";
            return response;
        }

        if (request.Date > latestEndDate)
        {
            response.Message =
                $"Ngày {request.Date:yyyy-MM-dd} đã kết thúc kỳ học. Kỳ học kết thúc vào {latestEndDate:yyyy-MM-dd}";
            return response;
        }

        response.IsInSession = true;

        var daysDifference = request.Date.DayNumber - earliestStartDate.DayNumber;
        var weekNumber = daysDifference / 7 + 1;

        response.WeekNumber = weekNumber;
        response.Message = $"Tuần thứ {weekNumber} trong kỳ học (tính từ {earliestStartDate:yyyy-MM-dd})";

        return response;
    }
}