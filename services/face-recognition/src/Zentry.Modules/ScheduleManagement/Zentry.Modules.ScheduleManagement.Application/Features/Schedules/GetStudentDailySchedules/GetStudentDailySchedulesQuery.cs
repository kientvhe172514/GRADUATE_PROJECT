using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentDailySchedules;

public record GetStudentDailySchedulesQuery(Guid StudentId, DateOnly Date)
    : IQuery<List<StudentDailyClassDto>>;