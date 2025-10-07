using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ScheduleManagement.Domain.Entities;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;

public class ScheduleDbContext(DbContextOptions<ScheduleDbContext> options) : DbContext(options)
{
    public DbSet<Schedule> Schedules { get; set; }
    public DbSet<Course> Courses { get; set; }
    public DbSet<Room> Rooms { get; set; }
    public DbSet<Enrollment> Enrollments { get; set; }
    public DbSet<ClassSection> ClassSections { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ScheduleDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}