using Microsoft.EntityFrameworkCore;
using Zentry.Modules.DeviceManagement.Entities;

namespace Zentry.Modules.DeviceManagement.Persistence;

public class DeviceDbContext(DbContextOptions<DeviceDbContext> options) : DbContext(options)
{
    public DbSet<Device> Devices { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DeviceDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}