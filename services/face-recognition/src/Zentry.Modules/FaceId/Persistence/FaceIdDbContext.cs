using Microsoft.EntityFrameworkCore;
using Zentry.Modules.FaceId.Entities;

namespace Zentry.Modules.FaceId.Persistence;

public class FaceIdDbContext(DbContextOptions<FaceIdDbContext> options) : DbContext(options)
{
    public DbSet<FaceEmbedding> FaceEmbeddings { get; set; }
    public DbSet<FaceIdVerifyRequest> FaceIdVerifyRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(FaceIdDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}