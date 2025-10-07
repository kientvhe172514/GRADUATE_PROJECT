using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.Entities;

public class Schedule : AggregateRoot<Guid>
{
    private Schedule() : base(Guid.Empty)
    {
    }

    private Schedule(
        Guid id,
        Guid classSectionId,
        Guid roomId,
        DateOnly startDate,
        DateOnly endDate,
        TimeOnly startTime,
        TimeOnly endTime,
        WeekDayEnum weekWeekDay
    ) : base(id)
    {
        ClassSectionId = classSectionId;
        RoomId = roomId;
        StartDate = startDate;
        EndDate = endDate;
        StartTime = startTime;
        EndTime = endTime;
        WeekDay = weekWeekDay;
        CreatedAt = DateTime.UtcNow;
        IsDeleted = false;
    }

    [Required] public Guid ClassSectionId { get; private set; }

    [Required] public Guid RoomId { get; private set; }

    [Required] public DateOnly StartDate { get; private set; }

    [Required] public DateOnly EndDate { get; private set; }

    [Required] public TimeOnly StartTime { get; private set; }

    [Required] public TimeOnly EndTime { get; private set; }

    [Required] public WeekDayEnum WeekDay { get; private set; }
    public bool IsDeleted { get; private set; }


    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; } = DateTime.UtcNow;

    public virtual Room? Room { get; private set; }
    public virtual ClassSection? ClassSection { get; private set; }

    public static Schedule Create(
        Guid classSectionId,
        Guid roomId,
        DateOnly startDate,
        DateOnly endDate,
        TimeOnly startTime,
        TimeOnly endTime,
        WeekDayEnum weekDay)
    {
        return new Schedule(Guid.NewGuid(), classSectionId, roomId, startDate, endDate, startTime, endTime, weekDay);
    }

    public void Update(
        Guid? roomId = null,
        DateOnly? startDate = null,
        DateOnly? endDate = null,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        WeekDayEnum? weekDay = null)
    {
        if (roomId.HasValue) RoomId = roomId.Value;
        if (startDate.HasValue) StartDate = startDate.Value;
        if (endDate.HasValue) EndDate = endDate.Value;
        if (startTime.HasValue) StartTime = startTime.Value;
        if (endTime.HasValue) EndTime = endTime.Value;
        if (weekDay != null) WeekDay = weekDay;

        UpdatedAt = DateTime.UtcNow;
    }

    public void Delete()
    {
        if (IsDeleted) return;
        IsDeleted = true;
        UpdatedAt = DateTime.UtcNow;
    }
}