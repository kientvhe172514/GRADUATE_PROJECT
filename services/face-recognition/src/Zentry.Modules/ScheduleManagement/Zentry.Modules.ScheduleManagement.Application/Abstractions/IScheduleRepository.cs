using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetSchedules;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Data;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Abstractions;

public interface IScheduleRepository : IRepository<Schedule, Guid>
{
    Task<List<Schedule>> GetSchedulesByClassSectionIdsAsync(List<Guid> classSectionIds,
        CancellationToken cancellationToken);

    Task SoftDeleteAsync(Schedule entity, CancellationToken cancellationToken);

    Task<bool> IsRoomAvailableForUpdateAsync(Guid roomId, WeekDayEnum weekDay, TimeOnly startTime, TimeOnly endTime,
        DateOnly startDate, DateOnly endDate, Guid scheduleIdToExclude, CancellationToken cancellationToken);

    Task<bool> HasActiveScheduleByClassSectionIdAsync(Guid classSectionId, CancellationToken cancellationToken);
    Task<bool> HasActiveScheduleInTermByRoomIdAsync(Guid roomId, CancellationToken cancellationToken);
    Task<bool> HasActiveScheduleInTermAsync(Guid courseId, CancellationToken cancellationToken);
    Task<bool> IsBookedScheduleByRoomIdAsync(Guid roomId, CancellationToken cancellationToken);
    Task<List<Schedule>> GetSchedulesByClassSectionIdAsync(Guid classSectionId, CancellationToken cancellationToken);

    Task<List<ScheduleWithRoomDto>> GetActiveSchedulesByClassSectionIdsAndDayAsync(
        List<Guid> classSectionIds, WeekDayEnum dayOfWeek, DateOnly date, CancellationToken cancellationToken);

    Task<ScheduleDetailsWithRelationsDto?> GetScheduleDetailsWithRelationsAsync(Guid scheduleId,
        CancellationToken cancellationToken);

    Task<ClassDetailProjectionDto?> GetScheduleDetailsForClassSectionAsync(Guid classSectionId,
        CancellationToken cancellationToken);

    Task<bool> IsLecturerAvailableAsync(Guid lecturerId, WeekDayEnum weekDay, TimeOnly startTime, TimeOnly endTime,
        CancellationToken cancellationToken);

    Task<bool> IsRoomAvailableAsync(Guid roomId, WeekDayEnum weekDay, TimeOnly startTime,
        TimeOnly endTime, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken);

    Task<Tuple<List<Schedule>, int>> GetPagedSchedulesAsync(ScheduleListCriteria criteria,
        CancellationToken cancellationToken);

    Task<Tuple<List<Schedule>, int>> GetPagedSchedulesWithIncludesAsync(
        ScheduleListCriteria criteria,
        CancellationToken cancellationToken);

    Task<Schedule?> GetByIdWithClassSectionAsync(Guid id, CancellationToken cancellationToken);

    Task<List<ScheduleProjectionDto>> GetLecturerSchedulesForDateAsync(
        Guid lecturerId,
        DateTime date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken);

    Task<List<Schedule>> GetSchedulesByClassSectionIdAndDateAsync(Guid classSectionId, DateTime date,
        WeekDayEnum weekDay, CancellationToken cancellationToken);

    Task<List<Schedule>> GetSchedulesByDateAsync(DateOnly date, CancellationToken cancellationToken);

    Task<List<LecturerDailyReportScheduleProjectionDto>> GetLecturerReportSchedulesForDateAsync(
        Guid lecturerId,
        DateTime date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken);

    Task<List<ScheduleProjectionDto>> GetSchedulesByClassSectionIdsAndDateAsync(
        List<Guid> classSectionIds,
        DateOnly date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken);

    Task DeleteRangeAsync(IEnumerable<Schedule> entities, CancellationToken cancellationToken);
}