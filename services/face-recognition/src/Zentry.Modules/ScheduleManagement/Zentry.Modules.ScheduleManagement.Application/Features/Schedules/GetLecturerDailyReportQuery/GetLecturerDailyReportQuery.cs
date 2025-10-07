using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetLecturerDailyReportQuery;

public record GetLecturerDailyReportQuery(Guid LecturerId, DateTime Date) : IQuery<List<LecturerDailyReportDto>>;