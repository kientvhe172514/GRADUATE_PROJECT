using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Persistence.Configurations;

public class ScheduleConfiguration : IEntityTypeConfiguration<Schedule>
{
    [Obsolete("Obsolete")]
    public void Configure(EntityTypeBuilder<Schedule> builder)
    {
        builder.ToTable("Schedules");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.Id)
            .ValueGeneratedOnAdd();

        builder.Property(s => s.ClassSectionId)
            .IsRequired();

        builder.Property(s => s.RoomId)
            .IsRequired();

        builder.Property(s => s.StartDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(s => s.EndDate)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(s => s.StartTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(s => s.EndTime)
            .HasColumnType("time without time zone")
            .IsRequired();

        builder.Property(s => s.WeekDay)
            .HasConversion(
                dw => dw.ToString(),
                dw => WeekDayEnum.FromName(dw)
            )
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(s => s.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(s => s.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        // Relationships
        builder.HasOne(s => s.ClassSection)
            .WithMany(cs => cs.Schedules)
            .HasForeignKey(s => s.ClassSectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(s => s.Room)
            .WithMany()
            .HasForeignKey(s => s.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indices
        builder.HasIndex(s => s.ClassSectionId);
        builder.HasIndex(s => s.RoomId);
        builder.HasIndex(s => s.StartDate);
        builder.HasIndex(s => s.EndDate);
        builder.HasIndex(s => s.StartTime);
        builder.HasIndex(s => s.EndTime);
        builder.HasIndex(s => s.WeekDay);

        builder.HasCheckConstraint("CK_Schedules_EndTime_After_StartTime",
            "\"EndTime\" > \"StartTime\"");

        builder.HasIndex(s => new { s.RoomId, s.StartDate, s.StartTime, s.EndTime });
        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}