using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.UserManagement.Entities;

namespace Zentry.Modules.UserManagement.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Id)
            .ValueGeneratedOnAdd();

        builder.Property(u => u.AccountId)
            .IsRequired();

        builder.HasOne(u => u.Account)
            .WithOne()
            .HasForeignKey<User>(u => u.AccountId)
            .IsRequired();

        builder.Property(u => u.FullName)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(20); // As per DB design

        builder.Property(u => u.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.Property(u => u.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.Property(u => u.HasFaceId)
            .HasDefaultValue(false)
            .IsRequired();

        builder.Property(u => u.FaceIdLastUpdated)
            .IsRequired(false);

        builder.HasIndex(u => u.AccountId)
            .IsUnique();

        builder.HasIndex(u => u.FullName);
        builder.HasIndex(u => u.PhoneNumber);
    }
}