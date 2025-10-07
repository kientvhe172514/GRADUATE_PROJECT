using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Persistence.Configurations;

public class SettingConfiguration : IEntityTypeConfiguration<Setting>
{
    public void Configure(EntityTypeBuilder<Setting> builder)
    {
        builder.ToTable("Settings");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .ValueGeneratedOnAdd();

        builder.Property(c => c.AttributeId)
            .IsRequired();

        builder.Property(c => c.ScopeType)
            .HasConversion(
                st => st.ToString(),
                st => ScopeType.FromName(st)
            )
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(c => c.ScopeId)
            .IsRequired();

        builder.Property(c => c.Value)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.HasIndex(c => c.AttributeId);
        builder.HasIndex(c => c.ScopeType);
        builder.HasIndex(c => c.ScopeId);

        builder.HasIndex(c => new { c.AttributeId, c.ScopeType, c.ScopeId })
            .IsUnique();

        builder.HasOne(c => c.AttributeDefinition)
            .WithMany()
            .HasForeignKey(c => c.AttributeId)
            .IsRequired();
    }
}