using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetEnrollmentsByClassSectionIdIntegrationQueryHandler(IEnrollmentRepository enrollmentRepository)
    : IQueryHandler<GetEnrollmentsByClassSectionIdIntegrationQuery, GetEnrollmentsByClassSectionIdIntegrationResponse>
{
    public async Task<GetEnrollmentsByClassSectionIdIntegrationResponse> Handle(
        GetEnrollmentsByClassSectionIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        // Giả sử EnrollmentRepository có GetEnrollmentsByClassSectionIdAsync trả về List<Enrollment>
        var enrollments =
            await enrollmentRepository.GetEnrollmentsByClassSectionIdAsync(request.ClassSectionId, cancellationToken);

        if (enrollments.Count == 0)
            return new GetEnrollmentsByClassSectionIdIntegrationResponse(new List<BasicEnrollmentDto>());

        var dtos = enrollments.Select(e => new BasicEnrollmentDto
        {
            Id = e.Id,
            StudentId = e.StudentId,
            EnrolledAt = e.EnrolledAt,
            Status = e.Status.ToString()
        }).ToList();

        return new GetEnrollmentsByClassSectionIdIntegrationResponse(dtos);
    }
}