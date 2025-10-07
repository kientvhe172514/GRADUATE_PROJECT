using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.FaceId.Entities;

public class FaceEmbedding : AggregateRoot<Guid>
{
    private FaceEmbedding() : base(Guid.Empty)
    {
    }

    private FaceEmbedding(Guid id, Guid userId, byte[]? encryptedEmbedding) : base(id)
    {
        UserId = userId;
        EncryptedEmbedding = encryptedEmbedding;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public Guid UserId { get; private set; }
    public byte[]? EncryptedEmbedding { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public static FaceEmbedding Create(Guid userId, byte[]? encryptedEmbedding)
    {
        return new FaceEmbedding(Guid.NewGuid(), userId, encryptedEmbedding);
    }

    public void UpdateEncrypted(byte[] encryptedEmbedding)
    {
        EncryptedEmbedding = encryptedEmbedding;
        UpdatedAt = DateTime.UtcNow;
    }
}