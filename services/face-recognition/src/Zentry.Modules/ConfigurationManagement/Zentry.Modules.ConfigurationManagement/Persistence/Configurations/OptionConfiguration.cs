using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ConfigurationManagement.Entities;

namespace Zentry.Modules.ConfigurationManagement.Persistence.Configurations;

public class OptionConfiguration : IEntityTypeConfiguration<Option>
{
    public void Configure(EntityTypeBuilder<Option> builder)
    {
        builder.ToTable("Options");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Id)
            .ValueGeneratedOnAdd();

        builder.Property(o => o.AttributeId)
            .IsRequired();

        builder.Property(o => o.Value)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(o => o.DisplayLabel)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(o => o.SortOrder)
            .IsRequired();

        builder.Property(o => o.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(o => o.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.HasIndex(o => o.AttributeId);
        builder.HasIndex(o => o.SortOrder);

        builder.HasIndex(o => new { o.AttributeId, o.Value })
            .IsUnique();

        builder.HasIndex(o => new { o.AttributeId, o.DisplayLabel })
            .IsUnique();

        builder.HasOne(o => o.AttributeDefinition)
            .WithMany(ad => ad.Options)
            .HasForeignKey(o => o.AttributeId)
            .IsRequired();
    }
}