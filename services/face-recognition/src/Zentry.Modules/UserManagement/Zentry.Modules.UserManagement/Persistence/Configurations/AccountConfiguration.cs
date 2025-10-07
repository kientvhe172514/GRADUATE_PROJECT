using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.UserManagement.Entities;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.Modules.UserManagement.Persistence.Configurations;

public class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");

        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id)
            .ValueGeneratedOnAdd();

        builder.Property(a => a.Email).IsRequired().HasMaxLength(255);
        builder.HasIndex(a => a.Email).IsUnique();
        builder.Property(a => a.PasswordHash).IsRequired().HasMaxLength(255);
        builder.Property(a => a.PasswordSalt).IsRequired().HasMaxLength(255);

        builder.Property(a => a.Role)
            .HasConversion(
                role => role.ToString(),
                roleString => Role.FromName(roleString)
            )
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(a => a.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();

        builder.Property(a => a.Status)
            .HasConversion(
                status => status.ToString(),
                statusString => AccountStatus.FromName(statusString)
            )
            .IsRequired()
            .HasDefaultValueSql("'Active'");

        builder.HasIndex(a => a.Status);

        builder.Property(a => a.ResetToken).HasMaxLength(255);
        builder.Property(a => a.ResetTokenExpiryTime);

        builder.HasIndex(a => a.ResetToken)
            .IsUnique()
            .HasFilter("\"ResetToken\" IS NOT NULL");
    }
}