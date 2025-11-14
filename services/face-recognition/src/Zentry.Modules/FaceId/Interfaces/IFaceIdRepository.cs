using Zentry.Modules.FaceId.Dtos;
using Zentry.Modules.FaceId.Entities;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.FaceId.Interfaces;

public interface IFaceIdRepository : IRepository<FaceEmbedding, Guid>
{
    Task<FaceEmbedding?> GetByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    Task<(int UserId, DateTime CreatedAt, DateTime UpdatedAt)?> GetMetaByUserIdAsync(int userId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<FaceEmbedding> CreateAsync(int userId, float[] embedding, CancellationToken cancellationToken = default);
    Task<FaceEmbedding> UpdateAsync(int userId, float[] embedding, CancellationToken cancellationToken = default);

    Task<(bool IsMatch, float Similarity)> VerifyAsync(int userId, float[] embedding, float threshold = 0.7f,
        CancellationToken cancellationToken = default);

    Task<FaceIdVerifyRequest> CreateVerifyRequestAsync(
        Guid requestGroupId,
        int targetUserId,
        int? initiatorUserId,
        Guid? sessionId,
        Guid? classSectionId,
        float threshold,
        DateTime expiresAt,
        CancellationToken cancellationToken = default);

    Task<FaceIdVerifyRequest?> GetVerifyRequestAsync(Guid requestId, CancellationToken cancellationToken = default);

    Task CompleteVerifyRequestAsync(FaceIdVerifyRequest request, bool matched, float similarity,
        CancellationToken cancellationToken = default);

    Task CancelVerifyRequestsByGroupAsync(Guid requestGroupId, CancellationToken cancellationToken = default);

    // New methods for session-based management
    Task<List<FaceIdVerifyRequest>> GetActiveVerifyRequestsBySessionAsync(Guid sessionId,
        CancellationToken cancellationToken = default);

    Task CancelVerifyRequestsBySessionAsync(Guid sessionId, CancellationToken cancellationToken = default);
    Task<List<FaceIdVerifyRequest>> GetExpiredVerifyRequestsAsync(CancellationToken cancellationToken = default);

    Task MarkVerifyRequestsAsExpiredAsync(List<FaceIdVerifyRequest> requests,
        CancellationToken cancellationToken = default);

    // ✅ Thêm method mới
    Task<FaceIdVerifyRequest?> GetVerifyRequestByGroupAndUserAsync(
        Guid requestGroupId,
        int targetUserId,
        CancellationToken cancellationToken = default);

    // ✅ Thêm: Method để cập nhật verify request
    Task UpdateVerifyRequestAsync(FaceIdVerifyRequest request, CancellationToken cancellationToken = default);

    Task<IEnumerable<UserFaceIdStatusDto>> GetAllUsersWithFaceIdStatusAsync(
        CancellationToken cancellationToken = default);

    Task<IEnumerable<UserFaceIdStatusDto>> GetUsersFaceIdStatusAsync(IEnumerable<int> userIds,
        CancellationToken cancellationToken = default);

    // Query verify requests by session and a set of students
    Task<List<FaceIdVerifyRequest>> GetVerifyRequestsBySessionAndUsersAsync(
        Guid sessionId,
        IEnumerable<int> userIds,
        CancellationToken cancellationToken = default);
}