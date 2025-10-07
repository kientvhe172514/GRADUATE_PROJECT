using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentMonthlyCalendar;

public record GetStudentMonthlyCalendarQuery(Guid StudentId, int Month, int Year)
    : IQuery<MonthlyCalendarResponseDto>;