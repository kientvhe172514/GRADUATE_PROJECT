using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetStudentIdsByClassSectionIdIntegrationQuery(Guid ClassSectionId)
    : IQuery<GetStudentIdsByClassSectionIdIntegrationResponse>;

public record GetStudentIdsByClassSectionIdIntegrationResponse(
    List<Guid> StudentIds
);