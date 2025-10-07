using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerMonthlyCalendar;

public record GetLecturerMonthlyCalendarQuery(Guid LecturerId, int Month, int Year)
    : IQuery<MonthlyCalendarResponseDto>;