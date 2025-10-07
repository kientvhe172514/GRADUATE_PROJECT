using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.FaceId;

public record GetFaceIdResultByStudentIdsAndSessionIdIntegrationQuery(List<Guid> StudentIds, Guid SessionId)
    : IQuery<GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse>;

public record GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse(Dictionary<Guid, StudentFaceId> StudentStatus);

public record StudentFaceId(Guid StudentId, bool Matched);