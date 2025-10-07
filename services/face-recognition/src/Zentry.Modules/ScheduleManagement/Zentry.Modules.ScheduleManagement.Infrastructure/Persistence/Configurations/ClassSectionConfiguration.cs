using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Persistence.Configurations;

public class ClassSectionConfiguration : IEntityTypeConfiguration<ClassSection>
{
    public void Configure(EntityTypeBuilder<ClassSection> builder)
    {
        builder.ToTable("ClassSections");

        builder.HasKey(cs => cs.Id);

        builder.Property(cs => cs.Id)
            .ValueGeneratedOnAdd();

        builder.Property(cs => cs.CourseId)
            .IsRequired();

        builder.Property(cs => cs.LecturerId);

        builder.Property(cs => cs.SectionCode)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(cs => cs.Semester)
            .HasConversion(s => s.ToString(), v => Semester.Create(v))
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(cs => cs.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(cs => cs.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.HasOne(cs => cs.Course)
            .WithMany()
            .HasForeignKey(cs => cs.CourseId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(cs => cs.CourseId);
        builder.HasIndex(cs => cs.LecturerId);
        builder.HasIndex(cs => cs.Semester);
        builder.HasIndex(cs => cs.SectionCode).IsUnique();
        builder.HasMany(cs => cs.Schedules)
            .WithOne(s => s.ClassSection)
            .HasForeignKey(s => s.ClassSectionId);

        builder.HasMany(cs => cs.Enrollments)
            .WithOne(e => e.ClassSection)
            .HasForeignKey(e => e.ClassSectionId);
        builder.HasOne(cs => cs.Course)
            .WithMany(c => c.ClassSections)
            .HasForeignKey(cs => cs.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(c => !c.IsDeleted);
    }
}