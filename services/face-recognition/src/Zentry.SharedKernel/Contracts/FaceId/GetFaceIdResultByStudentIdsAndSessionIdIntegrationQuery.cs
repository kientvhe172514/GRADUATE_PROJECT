using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.FaceId;

public record GetFaceIdResultByStudentIdsAndSessionIdIntegrationQuery(List<int> StudentIds, Guid SessionId)
    : IQuery<GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse>;

public record GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse(Dictionary<int, StudentFaceId> StudentStatus);

public record StudentFaceId(int StudentId, bool Matched);