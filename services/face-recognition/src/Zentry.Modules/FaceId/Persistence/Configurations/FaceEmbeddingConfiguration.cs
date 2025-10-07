using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.FaceId.Entities;

namespace Zentry.Modules.FaceId.Persistence.Configurations;

public class FaceEmbeddingConfiguration : IEntityTypeConfiguration<FaceEmbedding>
{
    public void Configure(EntityTypeBuilder<FaceEmbedding> builder)
    {
        builder.ToTable("FaceEmbeddings");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.UserId)
            .IsRequired();

        builder.Property(e => e.EncryptedEmbedding)
            .HasColumnType("bytea")
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        // Create index for userId (one user can have only one face embedding)
        builder.HasIndex(e => e.UserId)
            .IsUnique();

        // Note: Vector index will be created in migration using raw SQL
        // since EF Core doesn't support vector index creation directly
    }
}