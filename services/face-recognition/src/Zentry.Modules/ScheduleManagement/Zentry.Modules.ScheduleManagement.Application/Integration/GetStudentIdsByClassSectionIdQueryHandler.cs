using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetStudentIdsByClassSectionIdQueryHandler(IEnrollmentRepository enrollmentRepository)
    : IQueryHandler<GetStudentIdsByClassSectionIdIntegrationQuery, GetStudentIdsByClassSectionIdIntegrationResponse>
{
    public async Task<GetStudentIdsByClassSectionIdIntegrationResponse> Handle(
        GetStudentIdsByClassSectionIdIntegrationQuery request, CancellationToken cancellationToken)
    {
        var studentIds =
            await enrollmentRepository.GetActiveStudentIdsByClassSectionIdAsync(request.ClassSectionId,
                cancellationToken);

        return new GetStudentIdsByClassSectionIdIntegrationResponse(studentIds);
    }
}