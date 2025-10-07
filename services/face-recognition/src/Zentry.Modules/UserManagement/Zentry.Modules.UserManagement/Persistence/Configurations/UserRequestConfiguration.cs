using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.UserManagement.Entities;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.UserManagement.Persistence.Configurations;

public class UserRequestConfiguration : IEntityTypeConfiguration<UserRequest>
{
    public void Configure(EntityTypeBuilder<UserRequest> builder)
    {
        builder.ToTable("UserRequests");

        builder.HasKey(ur => ur.Id);

        builder.Property(ur => ur.Id)
            .ValueGeneratedOnAdd();

        builder.Property(ur => ur.RequestedByUserId)
            .IsRequired();

        builder.Property(ur => ur.TargetUserId)
            .IsRequired();

        builder.Property(ur => ur.RequestType)
            .HasConversion(
                requestType => requestType.ToString(),
                name => RequestType.FromName(name)
            )
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ur => ur.RelatedEntityId)
            .IsRequired();

        builder.Property(ur => ur.Status)
            .HasConversion(
                status => status.ToString(),
                name => RequestStatus.FromName(name)
            )
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ur => ur.Reason)
            .HasMaxLength(500);

        builder.Property(ur => ur.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(ur => ur.ProcessedAt);

        builder.HasIndex(ur => ur.RequestedByUserId);
        builder.HasIndex(ur => ur.TargetUserId);
        builder.HasIndex(ur => ur.RequestType);
        builder.HasIndex(ur => ur.Status);
    }
}