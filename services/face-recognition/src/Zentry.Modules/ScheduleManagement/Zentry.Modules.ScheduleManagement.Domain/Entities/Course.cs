using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.Entities;

public class Course : AggregateRoot<Guid>
{
    private Course() : base(Guid.Empty)
    {
        ClassSections = new List<ClassSection>();
    }

    private Course(Guid id, string code, string name, string description)
        : base(id)
    {
        Code = code;
        Name = name;
        Description = description;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        IsDeleted = false;
        ClassSections = new List<ClassSection>();
    }

    [Required] [StringLength(50)] public string Code { get; private set; }

    [Required] [StringLength(255)] public string Name { get; private set; }

    [StringLength(1000)] public string Description { get; private set; }

    public virtual ICollection<ClassSection> ClassSections { get; set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public bool IsDeleted { get; private set; }

    public static Course Create(string code, string name, string description)
    {
        return new Course(Guid.NewGuid(), code, name, description);
    }

    public void Update(string? name = null, string? description = null)
    {
        if (!string.IsNullOrWhiteSpace(name) && Name != name)
        {
            Name = name;
            UpdatedAt = DateTime.UtcNow;
        }

        if (string.IsNullOrWhiteSpace(description) || Description == description) return;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }
}