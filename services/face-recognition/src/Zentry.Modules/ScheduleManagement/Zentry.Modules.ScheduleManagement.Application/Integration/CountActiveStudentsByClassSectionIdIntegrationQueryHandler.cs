using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class CountActiveStudentsByClassSectionIdIntegrationQueryHandler(IEnrollmentRepository enrollmentRepository)
    : IQueryHandler<CountActiveStudentsByClassSectionIdIntegrationQuery,
        CountActiveStudentsByClassSectionIdIntegrationResponse>
{
    public async Task<CountActiveStudentsByClassSectionIdIntegrationResponse> Handle(
        CountActiveStudentsByClassSectionIdIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        var count = await enrollmentRepository.CountActiveStudentsByClassSectionIdAsync(request.ClassSectionId,
            cancellationToken);
        return new CountActiveStudentsByClassSectionIdIntegrationResponse(count);
    }
}