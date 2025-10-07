using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetEnrollmentsByStudentIdIntegrationQuery(Guid StudentId)
    : IQuery<GetEnrollmentsByStudentIdIntegrationResponse>;

public record GetEnrollmentsByStudentIdIntegrationResponse(List<Guid> ClassSectionIds);