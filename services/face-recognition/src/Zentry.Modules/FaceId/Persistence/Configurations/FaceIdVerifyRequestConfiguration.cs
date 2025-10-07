using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.FaceId.Entities;

namespace Zentry.Modules.FaceId.Persistence.Configurations;

public class FaceIdVerifyRequestConfiguration : IEntityTypeConfiguration<FaceIdVerifyRequest>
{
    public void Configure(EntityTypeBuilder<FaceIdVerifyRequest> builder)
    {
        builder.ToTable("FaceIdVerifyRequests");

        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();

        builder.Property(x => x.RequestGroupId).IsRequired();
        builder.Property(x => x.TargetUserId).IsRequired();
        builder.Property(x => x.Threshold).HasColumnType("real").HasDefaultValue(0.7f).IsRequired();
        builder.Property(x => x.Status).HasConversion<int>().IsRequired();
        builder.Property(x => x.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP").IsRequired();
        builder.Property(x => x.ExpiresAt).IsRequired();
        builder.Property(x => x.CompletedAt).IsRequired(false);
        builder.Property(x => x.Matched).IsRequired(false);
        builder.Property(x => x.Similarity).HasColumnType("real").IsRequired(false);
        builder.Property(x => x.NotificationId).HasMaxLength(128).IsRequired(false);
        builder.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired(false);

        builder.HasIndex(x => new { x.RequestGroupId, x.TargetUserId, x.Status, x.ExpiresAt })
            .HasDatabaseName("IX_FaceIdReq_Group_Target_Status_Exp");
        builder.HasIndex(x => new { x.SessionId, x.Status }).HasDatabaseName("IX_FaceIdReq_Session_Status");
        builder.HasIndex(x => x.ExpiresAt).HasDatabaseName("IX_FaceIdReq_ExpiresAt");
    }
}