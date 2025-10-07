using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetCourseCodeIntegrationQuery(Guid CourseId) : IQuery<GetCourseCodeIntegrationResponse>;

public record GetCourseCodeIntegrationResponse(string CourseCode);