using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Zentry.Modules.ScheduleManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.Entities;

public class ClassSection : AggregateRoot<Guid>
{
    private ClassSection() : base(Guid.Empty)
    {
        Schedules = new List<Schedule>();
        Enrollments = new List<Enrollment>();
    }

    private ClassSection(Guid id, Guid courseId, string sectionCode, Semester semester)
        : base(id)
    {
        CourseId = courseId;
        SectionCode = sectionCode;
        Semester = semester;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        IsDeleted = false;

        Schedules = new HashSet<Schedule>();
        Enrollments = new HashSet<Enrollment>();
    }

    [Required] public Guid CourseId { get; private set; }

    public virtual Course? Course { get; private set; }

    public Guid? LecturerId { get; private set; }

    [Required] [StringLength(50)] public string SectionCode { get; private set; }

    [Required]
    [StringLength(4, MinimumLength = 4)]
    public Semester Semester { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public bool IsDeleted { get; private set; }

    [InverseProperty("ClassSection")] public virtual ICollection<Schedule> Schedules { get; private set; }

    [InverseProperty("ClassSection")] public virtual ICollection<Enrollment> Enrollments { get; private set; }
    // --------------------------------------------------------------------------------

    public static ClassSection Create(Guid courseId, string sectionCode, string semesterString)
    {
        var semester = Semester.Create(semesterString);
        return new ClassSection(Guid.NewGuid(), courseId, sectionCode, semester);
    }

    public void Update(string? sectionCode = null, string? semesterString = null)
    {
        if (!string.IsNullOrWhiteSpace(sectionCode)) SectionCode = sectionCode;
        if (!string.IsNullOrWhiteSpace(semesterString)) Semester = Semester.Create(semesterString);
        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AssignLecturer(Guid? lecturerId)
    {
        if (LecturerId == lecturerId) return;
        LecturerId = lecturerId;
        UpdatedAt = DateTime.UtcNow;
    }
}