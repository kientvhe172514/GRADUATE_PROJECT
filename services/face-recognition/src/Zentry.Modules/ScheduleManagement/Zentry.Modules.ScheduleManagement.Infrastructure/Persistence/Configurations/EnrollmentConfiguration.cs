using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Persistence.Configurations;

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.ToTable("Enrollments");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .ValueGeneratedOnAdd();

        builder.Property(e => e.StudentId)
            .IsRequired();

        builder.Property(e => e.ClassSectionId)
            .IsRequired();

        builder.Property(e => e.EnrolledAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(e => e.Status)
            .HasConversion(
                s => s.ToString(),
                s => EnrollmentStatus.FromName(s)
            )
            .HasMaxLength(20)
            .IsRequired();

        builder.HasOne(e => e.ClassSection)
            .WithMany(cs => cs.Enrollments)
            .HasForeignKey(e => e.ClassSectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(e => new { e.StudentId, e.ClassSectionId })
            .IsUnique()
            .HasDatabaseName("IX_Enrollments_StudentId_ClassSectionId");

        builder.HasIndex(e => e.StudentId);
        builder.HasIndex(e => e.ClassSectionId);
    }
}