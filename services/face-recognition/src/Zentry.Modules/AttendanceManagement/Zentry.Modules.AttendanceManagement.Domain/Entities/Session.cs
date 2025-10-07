using System.ComponentModel.DataAnnotations;
using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Constants.Response;
using Zentry.SharedKernel.Domain;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Domain.Entities;

public class Session : AggregateRoot<Guid>
{
    private Session() : base(Guid.Empty)
    {
        SessionConfigs = new SessionConfigSnapshot();
    }

    private Session(Guid id, Guid scheduleId, Guid? lecturerId, DateTime startTime, DateTime endTime,
        SessionStatus status, SessionConfigSnapshot sessionConfigs, int sessionNumber)
        : base(id)
    {
        ScheduleId = scheduleId;
        LecturerId = lecturerId;
        StartTime = startTime;
        EndTime = endTime;
        Status = status;
        CreatedAt = DateTime.UtcNow;
        SessionConfigs = sessionConfigs;
        SessionNumber = sessionNumber;
        AttendanceRecords = new List<AttendanceRecord>();
    }

    [Required] public Guid ScheduleId { get; private set; }

    public Guid? LecturerId { get; private set; }

    [Required] public DateTime StartTime { get; private set; }

    [Required] public DateTime EndTime { get; private set; }

    [Required] public SessionStatus Status { get; private set; }

    [Required] public int SessionNumber { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }
    public DateTime? ActualEndTime { get; private set; }
    public virtual ICollection<AttendanceRecord> AttendanceRecords { get; private set; }

    public SessionConfigSnapshot SessionConfigs { get; private set; }

    public int AttendanceWindowMinutes => SessionConfigs.AttendanceWindowMinutes;
    public int TotalAttendanceRounds => SessionConfigs.TotalAttendanceRounds;
    public int AbsentReportGracePeriodHours => SessionConfigs.AbsentReportGracePeriodHours;
    public int ManualAdjustmentGracePeriodHours => SessionConfigs.ManualAdjustmentGracePeriodHours;

    public static Session Create(Guid scheduleId, Guid? lecturerId, DateTime startTime, DateTime endTime,
        Dictionary<string, string> configs, int sessionNumber)
    {
        var sessionConfigs = SessionConfigSnapshot.FromDictionary(configs);
        return new Session(Guid.NewGuid(), scheduleId, lecturerId, startTime, endTime, SessionStatus.Pending,
            sessionConfigs, sessionNumber);
    }

    public static Session Create(Guid scheduleId, Guid? lecturerId, DateTime startTime, DateTime endTime,
        SessionConfigSnapshot sessionConfigs, int sessionNumber)
    {
        return new Session(Guid.NewGuid(), scheduleId, lecturerId, startTime, endTime, SessionStatus.Pending,
            sessionConfigs, sessionNumber);
    }

    public void AssignLecturer(Guid lecturerId)
    {
        if (LecturerId.HasValue && LecturerId.Value == lecturerId) return;
        LecturerId = lecturerId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Update(DateTime? startTime = null, DateTime? endTime = null)
    {
        if (startTime.HasValue && startTime.Value != StartTime)
        {
            StartTime = startTime.Value;
            UpdatedAt = DateTime.UtcNow;
        }

        if (endTime.HasValue && endTime.Value != EndTime)
        {
            EndTime = endTime.Value;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    public void UpdateConfig(string key, string value)
    {
        var newConfigs = SessionConfigs.ToDictionary();
        newConfigs[key] = value;
        SessionConfigs = SessionConfigSnapshot.FromDictionary(newConfigs);
        UpdatedAt = DateTime.UtcNow; // Cập nhật UpdatedAt khi config thay đổi
    }

    public void UpdateConfigs(Dictionary<string, string> configs)
    {
        SessionConfigs = SessionConfigs.Merge(configs);
        UpdatedAt = DateTime.UtcNow;
    }

    public void ActivateSession()
    {
        if (!Equals(Status, SessionStatus.Pending))
            throw new BusinessRuleException("SESSION_NOT_PENDING",
                "Không thể kích hoạt phiên khi trạng thái không phải Pending.");

        Status = SessionStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CompleteSession()
    {
        if (!Equals(Status, SessionStatus.Active))
            throw new BusinessRuleException(ErrorCodes.SessionNotActive,
                "Không thể hoàn thành phiên khi trạng thái không phải Active.");

        Status = SessionStatus.Completed;
        ActualEndTime = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void CancelSession()
    {
        if (!Equals(Status, SessionStatus.Active))
            throw new BusinessRuleException("ONLY_CANCEL_PENDING_SESSION", "Chỉ có thể cancel session đang pending.");

        Status = SessionStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MissedSession()
    {
        Status = SessionStatus.Missed;
        UpdatedAt = DateTime.UtcNow;
    }


    public bool IsWithinAttendanceWindow(DateTime currentTime)
    {
        var windowMinutes = SessionConfigs.AttendanceWindowMinutes;
        var sessionStartTimeLimit = StartTime.Subtract(TimeSpan.FromMinutes(windowMinutes));
        var sessionEndTimeLimit = EndTime.Add(TimeSpan.FromMinutes(windowMinutes));
        return currentTime >= sessionStartTimeLimit && currentTime <= sessionEndTimeLimit;
    }

    public int GetRemainingRounds(int currentRound)
    {
        var totalRounds = SessionConfigs.TotalAttendanceRounds;
        return Math.Max(0, totalRounds - currentRound);
    }

    public bool IsWithinAbsentReportGracePeriod(DateTime reportTime)
    {
        var gracePeriodHours = SessionConfigs.AbsentReportGracePeriodHours;
        var gracePeriodEnd = EndTime.AddHours(gracePeriodHours);
        return reportTime <= gracePeriodEnd;
    }

    public bool IsWithinManualAdjustmentGracePeriod(DateTime adjustmentTime)
    {
        var gracePeriodHours = SessionConfigs.ManualAdjustmentGracePeriodHours;
        var gracePeriodEnd = EndTime.AddHours(gracePeriodHours);
        return adjustmentTime <= gracePeriodEnd;
    }

    public T GetConfig<T>(string key, T defaultValue)
    {
        var value = SessionConfigs[key];
        if (value == null) return defaultValue;

        try
        {
            return (T)Convert.ChangeType(value, typeof(T));
        }
        catch
        {
            return defaultValue;
        }
    }

    public void SetConfig<T>(string key, T value)
    {
        UpdateConfig(key, value?.ToString() ?? "");
    }
}