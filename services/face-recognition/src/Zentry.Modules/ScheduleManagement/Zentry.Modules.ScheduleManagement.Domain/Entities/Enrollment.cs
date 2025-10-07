using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.Entities;

public class Enrollment : AggregateRoot<Guid>
{
    private Enrollment() : base(Guid.Empty)
    {
    }

    private Enrollment(Guid id, Guid studentId, Guid classSectionId)
        : base(id)
    {
        StudentId = studentId;
        ClassSectionId = classSectionId;
        EnrolledAt = DateTime.UtcNow;
        Status = EnrollmentStatus.Active;
    }

    [Required] public Guid StudentId { get; private set; }

    [Required] public Guid ClassSectionId { get; private set; }

    public DateTime EnrolledAt { get; private set; }

    [Required] public EnrollmentStatus Status { get; private set; }

    public virtual ClassSection? ClassSection { get; private set; }

    public static Enrollment Create(Guid studentId, Guid classSectionId)
    {
        return new Enrollment(Guid.NewGuid(), studentId, classSectionId);
    }

    public void CancelEnrollment()
    {
        Status = EnrollmentStatus.Cancelled;
    }
}