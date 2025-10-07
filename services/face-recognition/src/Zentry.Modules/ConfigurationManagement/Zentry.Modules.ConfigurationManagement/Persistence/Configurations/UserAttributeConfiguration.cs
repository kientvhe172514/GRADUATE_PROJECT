using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.ConfigurationManagement.Entities;

namespace Zentry.Modules.ConfigurationManagement.Persistence.Configurations;

public class UserAttributeConfiguration : IEntityTypeConfiguration<UserAttribute>
{
    public void Configure(EntityTypeBuilder<UserAttribute> builder)
    {
        builder.ToTable("UserAttributes");

        builder.HasKey(ua => ua.Id);

        builder.Property(ua => ua.Id)
            .ValueGeneratedOnAdd();

        builder.Property(ua => ua.UserId)
            .IsRequired();

        builder.Property(ua => ua.AttributeId)
            .IsRequired();

        builder.Property(ua => ua.AttributeValue)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(ua => ua.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(ua => ua.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.HasIndex(ua => new { ua.UserId, ua.AttributeId })
            .IsUnique();

        builder.HasIndex(ua => ua.UserId);
        builder.HasIndex(ua => ua.AttributeId);

        // --- Cấu hình mối quan hệ ---
        builder.HasOne(ua => ua.AttributeDefinition)
            .WithMany()
            .HasForeignKey(ua => ua.AttributeId)
            .IsRequired();
    }
}