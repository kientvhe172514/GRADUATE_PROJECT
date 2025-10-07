using Microsoft.EntityFrameworkCore;
using Zentry.Infrastructure.Security.Encryption;
using Zentry.Modules.FaceId.Dtos;
using Zentry.Modules.FaceId.Entities;
using Zentry.Modules.FaceId.Interfaces;

namespace Zentry.Modules.FaceId.Persistence.Repositories;

public class FaceIdRepository : IFaceIdRepository
{
    private readonly DataProtectionService _crypto;
    private readonly FaceIdDbContext _dbContext;

    public FaceIdRepository(FaceIdDbContext dbContext, DataProtectionService crypto)
    {
        _dbContext = dbContext;
        _crypto = crypto;
    }

    public async Task<FaceEmbedding?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceEmbeddings.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<FaceEmbedding?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceEmbeddings
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);
    }

    public async Task<(Guid UserId, DateTime CreatedAt, DateTime UpdatedAt)?> GetMetaByUserIdAsync(Guid userId,
        CancellationToken cancellationToken = default)
    {
        var res = await _dbContext.FaceEmbeddings
            .AsNoTracking()
            .Where(e => e.UserId == userId)
            .Select(e => new { e.UserId, e.CreatedAt, e.UpdatedAt })
            .FirstOrDefaultAsync(cancellationToken);

        if (res is null) return null;
        return (res.UserId, res.CreatedAt, res.UpdatedAt);
    }

    public async Task<bool> ExistsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceEmbeddings
            .AnyAsync(e => e.UserId == userId, cancellationToken);
    }

    public async Task<FaceEmbedding> CreateAsync(Guid userId, float[] embedding,
        CancellationToken cancellationToken = default)
    {
        // Encrypt embedding bytes
        var rawBytes = new byte[embedding.Length * 4];
        Buffer.BlockCopy(embedding, 0, rawBytes, 0, rawBytes.Length);
        var encrypted = _crypto.Encrypt(rawBytes);

        // Create entity and save using EF Core
        var entity = FaceEmbedding.Create(userId, encrypted);
        _dbContext.FaceEmbeddings.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return entity;
    }

    public async Task<FaceEmbedding> UpdateAsync(Guid userId, float[] embedding,
        CancellationToken cancellationToken = default)
    {
        // Check if user has a face ID
        var existingEntity = await _dbContext.FaceEmbeddings
            .FirstOrDefaultAsync(e => e.UserId == userId, cancellationToken);

        if (existingEntity == null)
            throw new InvalidOperationException($"Face embedding for user {userId} not found");

        // Encrypt embedding bytes
        var rawBytes = new byte[embedding.Length * 4];
        Buffer.BlockCopy(embedding, 0, rawBytes, 0, rawBytes.Length);
        var encrypted = _crypto.Encrypt(rawBytes);

        // Update entity using EF Core
        existingEntity.UpdateEncrypted(encrypted);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return existingEntity;
    }

    public async Task<(bool IsMatch, float Similarity)> VerifyAsync(Guid userId, float[] embedding,
        float threshold = 0.7f, CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if user exists first
            var exists = await _dbContext.FaceEmbeddings
                .AnyAsync(e => e.UserId == userId, cancellationToken);

            if (!exists) return (false, 0);

            // Read encrypted payload and compute cosine in .NET
            var row = await _dbContext.FaceEmbeddings
                .AsNoTracking()
                .Where(e => e.UserId == userId)
                .Select(e => e.EncryptedEmbedding)
                .FirstOrDefaultAsync(cancellationToken);

            if (row == null) return (false, 0);
            var decrypted = _crypto.Decrypt(row);
            var stored = new float[decrypted.Length / 4];
            Buffer.BlockCopy(decrypted, 0, stored, 0, decrypted.Length);

            var query = embedding;
            NormalizeL2Vector(stored);
            NormalizeL2Vector(query);

            var similarity = CalculateCosineSimilarity(stored, query);
            return (similarity >= threshold, similarity);
        }
        catch (Exception)
        {
            // Fallback: If SQL fails, just return false for security
            return (false, 0);
        }
    }

    public async Task<IEnumerable<FaceEmbedding>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceEmbeddings.ToListAsync(cancellationToken);
    }

    public async Task<FaceIdVerifyRequest> CreateVerifyRequestAsync(
        Guid requestGroupId,
        Guid targetUserId,
        Guid? initiatorUserId,
        Guid? sessionId,
        Guid? classSectionId,
        float threshold,
        DateTime expiresAt,
        CancellationToken cancellationToken = default)
    {
        var entity = FaceIdVerifyRequest.Create(requestGroupId, targetUserId, initiatorUserId, sessionId,
            classSectionId, threshold, expiresAt);
        _dbContext.FaceIdVerifyRequests.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<FaceIdVerifyRequest?> GetVerifyRequestAsync(Guid requestId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceIdVerifyRequests.FindAsync(new object[] { requestId }, cancellationToken);
    }

    public async Task CompleteVerifyRequestAsync(FaceIdVerifyRequest request, bool matched, float similarity,
        CancellationToken cancellationToken = default)
    {
        request.MarkCompleted(matched, similarity);
        _dbContext.FaceIdVerifyRequests.Update(request);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task CancelVerifyRequestsByGroupAsync(Guid requestGroupId,
        CancellationToken cancellationToken = default)
    {
        var items = await _dbContext.FaceIdVerifyRequests
            .Where(r => r.RequestGroupId == requestGroupId && r.Status == FaceIdVerifyRequestStatus.Pending)
            .ToListAsync(cancellationToken);
        foreach (var r in items) r.Cancel();
        if (items.Count > 0)
        {
            _dbContext.FaceIdVerifyRequests.UpdateRange(items);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    // New methods for session-based management
    public async Task<List<FaceIdVerifyRequest>> GetActiveVerifyRequestsBySessionAsync(Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceIdVerifyRequests
            .Where(r => r.SessionId == sessionId && r.Status == FaceIdVerifyRequestStatus.Pending &&
                        r.ExpiresAt > DateTime.UtcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task CancelVerifyRequestsBySessionAsync(Guid sessionId, CancellationToken cancellationToken = default)
    {
        var items = await _dbContext.FaceIdVerifyRequests
            .Where(r => r.SessionId == sessionId && r.Status == FaceIdVerifyRequestStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var r in items) r.Cancel();

        if (items.Count > 0)
        {
            _dbContext.FaceIdVerifyRequests.UpdateRange(items);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<FaceIdVerifyRequest>> GetExpiredVerifyRequestsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceIdVerifyRequests
            .Where(r => r.Status == FaceIdVerifyRequestStatus.Pending && r.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync(cancellationToken);
    }

    public async Task MarkVerifyRequestsAsExpiredAsync(List<FaceIdVerifyRequest> requests,
        CancellationToken cancellationToken = default)
    {
        foreach (var request in requests) request.MarkExpired();

        if (requests.Count > 0)
        {
            _dbContext.FaceIdVerifyRequests.UpdateRange(requests);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<FaceIdVerifyRequest>> GetVerifyRequestsBySessionAndUsersAsync(
        Guid sessionId,
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var userIdList = userIds.ToList();
        if (userIdList.Count == 0) return new List<FaceIdVerifyRequest>();

        return await _dbContext.FaceIdVerifyRequests
            .Where(r => r.SessionId == sessionId && userIdList.Contains(r.TargetUserId))
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(FaceEmbedding entity, CancellationToken cancellationToken = default)
    {
        _dbContext.FaceEmbeddings.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(FaceEmbedding entity, CancellationToken cancellationToken = default)
    {
        _dbContext.FaceEmbeddings.Update(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(FaceEmbedding entity, CancellationToken cancellationToken = default)
    {
        _dbContext.FaceEmbeddings.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<FaceEmbedding> entities, CancellationToken cancellationToken = default)
    {
        await _dbContext.FaceEmbeddings.AddRangeAsync(entities, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<UserFaceIdStatusDto>> GetAllUsersWithFaceIdStatusAsync(
        CancellationToken cancellationToken = default)
    {
        // Get all users with Face ID status
        var usersWithFaceId = await _dbContext.FaceEmbeddings
            .AsNoTracking()
            .Select(e => new UserFaceIdStatusDto(
                e.UserId,
                true,
                e.CreatedAt,
                e.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        // Note: This method currently only returns users who have Face ID
        // To get ALL users (including those without Face ID), you would need to:
        // 1. Join with a Users table, or
        // 2. Accept a list of all user IDs as parameter, or
        // 3. Create a separate endpoint for getting all users from UserManagement module

        return usersWithFaceId;
    }

    public async Task<IEnumerable<UserFaceIdStatusDto>> GetUsersFaceIdStatusAsync(IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var userIdsList = userIds.ToList();

        // Get Face ID status for requested users
        var usersWithFaceId = await _dbContext.FaceEmbeddings
            .AsNoTracking()
            .Where(e => userIdsList.Contains(e.UserId))
            .Select(e => new UserFaceIdStatusDto(
                e.UserId,
                true,
                e.CreatedAt,
                e.UpdatedAt
            ))
            .ToListAsync(cancellationToken);

        // Create status for users without Face ID
        var usersWithFaceIdIds = usersWithFaceId.Select(u => u.UserId).ToHashSet();
        var usersWithoutFaceId = userIdsList
            .Where(id => !usersWithFaceIdIds.Contains(id))
            .Select(id => new UserFaceIdStatusDto(id, false));

        // Combine both lists
        return usersWithFaceId.Concat(usersWithoutFaceId);
    }

    // ✅ Thêm method mới
    public async Task<FaceIdVerifyRequest?> GetVerifyRequestByGroupAndUserAsync(
        Guid requestGroupId,
        Guid targetUserId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.FaceIdVerifyRequests
            .FirstOrDefaultAsync(r =>
                    r.RequestGroupId == requestGroupId &&
                    r.TargetUserId == targetUserId,
                cancellationToken);
    }

    // ✅ Thêm: Method để cập nhật verify request
    public async Task UpdateVerifyRequestAsync(FaceIdVerifyRequest request,
        CancellationToken cancellationToken = default)
    {
        _dbContext.FaceIdVerifyRequests.Update(request);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static float CalculateCosineSimilarity(float[] vector1, float[] vector2)
    {
        if (vector1.Length != vector2.Length)
            throw new ArgumentException("Vectors must have the same length");

        float dotProduct = 0;
        float magnitude1 = 0;
        float magnitude2 = 0;

        for (var i = 0; i < vector1.Length; i++)
        {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }

        magnitude1 = MathF.Sqrt(magnitude1);
        magnitude2 = MathF.Sqrt(magnitude2);

        if (magnitude1 == 0 || magnitude2 == 0)
            return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    private static void NormalizeL2Vector(float[] v)
    {
        double sum = 0;
        for (var i = 0; i < v.Length; i++) sum += v[i] * v[i];
        var norm = Math.Sqrt(sum);
        if (norm == 0) return;
        for (var i = 0; i < v.Length; i++) v[i] = (float)(v[i] / norm);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null) await DeleteAsync(entity, cancellationToken);
    }
}