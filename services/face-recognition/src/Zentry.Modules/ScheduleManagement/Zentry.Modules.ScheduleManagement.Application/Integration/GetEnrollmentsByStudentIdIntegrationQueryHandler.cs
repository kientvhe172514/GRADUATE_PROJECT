using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetEnrollmentsByStudentIdIntegrationQueryHandler(
    IEnrollmentRepository enrollmentRepository)
    : IQueryHandler<GetEnrollmentsByStudentIdIntegrationQuery, GetEnrollmentsByStudentIdIntegrationResponse>
{
    public async Task<GetEnrollmentsByStudentIdIntegrationResponse> Handle(
        GetEnrollmentsByStudentIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var enrollments = await enrollmentRepository.GetEnrollmentsByStudentIdAsync(
            request.StudentId, cancellationToken);

        var classSectionIds = enrollments.Select(e => e.ClassSectionId).Distinct().ToList();

        return new GetEnrollmentsByStudentIdIntegrationResponse(classSectionIds);
    }
}