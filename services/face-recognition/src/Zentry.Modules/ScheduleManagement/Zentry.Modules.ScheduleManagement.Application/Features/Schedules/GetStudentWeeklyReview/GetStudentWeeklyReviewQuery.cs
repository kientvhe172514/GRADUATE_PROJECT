using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetStudentWeeklyReview;

public record GetStudentWeeklyReviewQuery(Guid StudentId) : IQuery<WeeklyReviewDto>;