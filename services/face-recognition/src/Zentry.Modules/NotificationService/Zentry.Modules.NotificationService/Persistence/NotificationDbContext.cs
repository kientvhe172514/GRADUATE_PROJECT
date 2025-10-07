using Microsoft.EntityFrameworkCore;
using Zentry.Modules.NotificationService.Entities;

namespace Zentry.Modules.NotificationService.Persistence;

public class NotificationDbContext(DbContextOptions<NotificationDbContext> options) : DbContext(options)
{
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notification>(builder =>
        {
            builder.HasKey(n => n.Id);
            builder.Property(n => n.Title).IsRequired().HasMaxLength(255);
            builder.Property(n => n.Body).IsRequired();
            builder.Property(n => n.RecipientUserId).IsRequired();
            builder.Property(n => n.IsRead).IsRequired();
            builder.Property(n => n.CreatedAt).IsRequired();

            // ✅ Thêm: Cấu hình cho field Type mới
            builder.Property(n => n.Type)
                .IsRequired()
                .HasConversion<string>(); // Lưu dưới dạng string trong DB

            // ✅ Thêm: Cấu hình cho field Deeplink mới
            builder.Property(n => n.Deeplink)
                .HasMaxLength(500); // Giới hạn độ dài deeplink

            // ✅ Thêm: Index cho Type để query nhanh hơn
            builder.HasIndex(n => n.Type);

            // ✅ Thêm: Index cho Deeplink để query nhanh hơn
            builder.HasIndex(n => n.Deeplink);

            builder.HasIndex(n => n.RecipientUserId);
        });
    }
}