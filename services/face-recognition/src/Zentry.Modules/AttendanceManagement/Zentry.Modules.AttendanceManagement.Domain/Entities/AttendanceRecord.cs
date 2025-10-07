using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class AttendanceRecord : AggregateRoot<Guid>
{
    private AttendanceRecord() : base(Guid.Empty)
    {
    }

    private AttendanceRecord(Guid id, Guid studentId, Guid sessionId, AttendanceStatus status, bool isManual,
        double percentageAttended, FaceIdStatus? faceIdStatus = null)
        : base(id)
    {
        StudentId = studentId;
        SessionId = sessionId;
        Status = status;
        IsManual = isManual;
        PercentageAttended = percentageAttended;
        FaceIdStatus = faceIdStatus;
        CreatedAt = DateTime.UtcNow;
        ExpiredAt = DateTime.UtcNow;
    }

    [Required] public Guid StudentId { get; private set; }

    [Required] public Guid SessionId { get; private set; }
    public virtual Session? Session { get; private set; }

    [Required] public AttendanceStatus Status { get; private set; }

    public bool IsManual { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime ExpiredAt { get; private set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public double PercentageAttended { get; private set; }

    /// <summary>
    ///     Face ID verification status for this attendance record
    ///     - NotChecked: Student did not perform FaceID verification
    ///     - Success: Student performed FaceID verification successfully
    ///     - Failed: Student performed FaceID verification but failed
    /// </summary>
    public FaceIdStatus? FaceIdStatus { get; private set; }

    public static AttendanceRecord Create(Guid userId, Guid sessionId, AttendanceStatus status, bool isManual,
        double percentageAttended, FaceIdStatus? faceIdStatus = null)
    {
        return new AttendanceRecord(Guid.NewGuid(), userId, sessionId, status, isManual, percentageAttended,
            faceIdStatus);
    }

    public void Update(AttendanceStatus? status = null, bool? isManual = null, DateTime? expiredAt = null,
        double? percentageAttended = null, FaceIdStatus? faceIdStatus = null)
    {
        if (status != null) Status = status;

        if (isManual.HasValue) IsManual = isManual.Value;
        if (expiredAt.HasValue) ExpiredAt = expiredAt.Value;
        if (percentageAttended.HasValue) PercentageAttended = percentageAttended.Value;
        if (faceIdStatus != null) FaceIdStatus = faceIdStatus;
        UpdatedAt = DateTime.UtcNow;
    }
}