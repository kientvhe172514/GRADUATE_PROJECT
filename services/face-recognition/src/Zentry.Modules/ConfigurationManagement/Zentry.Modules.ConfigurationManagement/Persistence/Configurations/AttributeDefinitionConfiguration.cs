using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Persistence.Configurations;

public class AttributeDefinitionConfiguration : IEntityTypeConfiguration<AttributeDefinition>
{
    public void Configure(EntityTypeBuilder<AttributeDefinition> builder)
    {
        builder.ToTable("AttributeDefinitions");

        builder.HasKey(ad => ad.Id);

        builder.Property(ad => ad.Id)
            .ValueGeneratedOnAdd();

        builder.Property(ad => ad.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ad => ad.DisplayName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(ad => ad.Description)
            .HasMaxLength(1000);

        builder.Property(ad => ad.DataType)
            .HasConversion(
                dt => dt.ToString(),
                dt => DataType.FromName(dt)
            )
            .IsRequired()
            .HasMaxLength(50);


        var scopeTypeListConverter = new ValueConverter<List<ScopeType>, string>(
            v => string.Join(",",
                v.Select(st => st.ToString())),
            v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(name => ScopeType.FromName(name.Trim()))
                .ToList()
        );

        builder.Property(ad => ad.AllowedScopeTypes)
            .HasConversion(scopeTypeListConverter)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(ad => ad.Unit)
            .HasMaxLength(50);

        builder.Property(ad => ad.DefaultValue)
            .HasMaxLength(1000);

        builder.Property(ad => ad.IsDeletable)
            .IsRequired();

        builder.Property(ad => ad.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(ad => ad.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.HasIndex(ad => ad.Key)
            .IsUnique();

        builder.HasIndex(ad => ad.DataType);
    }
}