using Zentry.Modules.FaceId.Entities;
using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.FaceId;

namespace Zentry.Modules.FaceId.Integration;

public class GetFaceIdResultByStudentIdsAndSessionIdQueryHandler(IFaceIdRepository faceIdRepository)
    : IQueryHandler<GetFaceIdResultByStudentIdsAndSessionIdIntegrationQuery,
        GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse>
{
    public async Task<GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse> Handle(
        GetFaceIdResultByStudentIdsAndSessionIdIntegrationQuery request, CancellationToken cancellationToken)
    {
        // Convert Guid StudentIds to int
        var intStudentIds = request.StudentIds
            .Select(guid => {
                var hex = guid.ToString("N").Substring(20, 12);
                return int.Parse(hex, System.Globalization.NumberStyles.HexNumber);
            })
            .ToList();
            
        // Fetch all verify requests for the session and provided students
        var verifyRequests = await faceIdRepository.GetVerifyRequestsBySessionAndUsersAsync(
            request.SessionId,
            intStudentIds,
            cancellationToken);
        var statusMap = new Dictionary<int, StudentFaceId>();

        if (verifyRequests.Count is 0) return new GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse(statusMap);

        var requestsByUser = verifyRequests.GroupBy(r => r.TargetUserId);
        foreach (var group in requestsByUser)
        {
            var userId = group.Key;
            var anyCompletedFalse =
                group.Any(r => r.Status == FaceIdVerifyRequestStatus.Completed && r.Matched == false);
            var anyCompletedTrue = group.Any(r => r.Status == FaceIdVerifyRequestStatus.Completed && r.Matched == true);

            bool matched;
            // Business rule: any failure dominates => overall false
            if (anyCompletedFalse)
                matched = false;
            else if (anyCompletedTrue)
                matched = true;
            else
                // All are non-completed (Pending/Expired/Canceled) or no records for user => default false
                matched = false;

            statusMap[userId] = new StudentFaceId(userId, matched);
        }

        // Ensure all requested students appear in result, even if no verify request rows exist
        foreach (var sid in intStudentIds)
            if (!statusMap.ContainsKey(sid))
                statusMap[sid] = new StudentFaceId(sid, false);

        return new GetFaceIdResultByStudentIdsAndSessionIdIntegrationResponse(statusMap);
    }
}