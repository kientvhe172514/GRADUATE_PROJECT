using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.AttendanceManagement.Infrastructure.Persistence.Configurations;

public class RoundConfiguration : IEntityTypeConfiguration<Round>
{
    [Obsolete("Obsolete")]
    public void Configure(EntityTypeBuilder<Round> builder)
    {
        builder.ToTable("Rounds");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .ValueGeneratedOnAdd();

        builder.Property(r => r.SessionId)
            .IsRequired();

        builder.Property(r => r.RoundNumber)
            .IsRequired();

        builder.Property(r => r.StartTime)
            .IsRequired();

        builder.Property(r => r.EndTime)
            .IsRequired();

        builder.Property(ar => ar.Status)
            .HasConversion(
                s => s.ToString(),
                s => RoundStatus.FromName(s)
            )
            .HasMaxLength(20)
            .IsRequired();
        // ----------------------------------------------

        builder.Property(r => r.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(r => r.UpdatedAt)
            .ValueGeneratedOnAddOrUpdate()
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

        builder.HasIndex(r => r.SessionId);
        builder.HasIndex(r => r.StartTime);
        builder.HasIndex(r => r.EndTime);

        builder.HasIndex(r => new { r.SessionId, r.RoundNumber })
            .IsUnique();

        builder.HasCheckConstraint("CK_Rounds_EndTime_After_StartTime",
            "\"EndTime\" > \"StartTime\"");
    }
}