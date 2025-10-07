using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Zentry.Modules.DeviceManagement.Entities;
using Zentry.Modules.DeviceManagement.ValueObjects;
using Zentry.SharedKernel.Constants.Device;

namespace Zentry.Modules.DeviceManagement.Persistence.Configurations;

public class DeviceConfiguration : IEntityTypeConfiguration<Device>
{
    public void Configure(EntityTypeBuilder<Device> builder)
    {
        builder.ToTable("Devices");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .ValueGeneratedOnAdd();

        builder.Property(d => d.UserId).IsRequired();

        builder.Property(d => d.DeviceName)
            .HasConversion(n => n.Value, v => DeviceName.Create(v))
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(d => d.DeviceToken)
            .HasConversion(t => t.Value, v => DeviceToken.FromValue(v))
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(d => d.AndroidId)
            .HasConversion(
                a => a.Value,
                v => AndroidId.Create(v))
            .HasMaxLength(255)
            .IsRequired();

        builder.HasIndex(d => d.DeviceToken).IsUnique();
        builder.HasIndex(d => d.AndroidId).IsUnique();
        builder.HasIndex(d => d.Status);
        builder.HasIndex(d => d.UserId);

        builder.HasIndex(d => new { d.UserId, d.AndroidId })
            .HasDatabaseName("IX_Devices_UserId_AndroidId");

        builder.HasIndex(d => new { d.AndroidId, d.Status })
            .HasDatabaseName("IX_Devices_AndroidId_Status");

        builder.Property(d => d.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        builder.Property(d => d.UpdatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .ValueGeneratedOnAddOrUpdate();
        builder.Property(d => d.LastVerifiedAt);
        builder.Property(d => d.Status)
            .HasConversion(s => s.ToString(), n => DeviceStatus.FromName(n))
            .HasDefaultValueSql("'Active'");

        // Cấu hình các trường optional
        builder.Property(d => d.Platform).HasMaxLength(50);
        builder.Property(d => d.OsVersion).HasMaxLength(50);
        builder.Property(d => d.Model).HasMaxLength(100);
        builder.Property(d => d.Manufacturer).HasMaxLength(100);
        builder.Property(d => d.AppVersion).HasMaxLength(50);
        builder.Property(d => d.PushNotificationToken).HasMaxLength(500);
    }
}