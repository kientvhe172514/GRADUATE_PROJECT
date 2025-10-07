using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetSchedules;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Repositories;

public class ScheduleRepository(ScheduleDbContext dbContext) : IScheduleRepository
{
    public async Task<bool> IsRoomAvailableForUpdateAsync(
        Guid roomId,
        WeekDayEnum weekDay,
        TimeOnly startTime,
        TimeOnly endTime,
        DateOnly startDate,
        DateOnly endDate,
        Guid scheduleIdToExclude,
        CancellationToken cancellationToken)
    {
        var overlap = await dbContext.Schedules
            .AnyAsync(s => s.Id != scheduleIdToExclude &&
                           s.RoomId == roomId &&
                           s.WeekDay == weekDay &&
                           s.StartTime < endTime &&
                           s.EndTime > startTime &&
                           (s.StartDate < endDate || s.EndDate > startDate) &&
                           !s.IsDeleted,
                cancellationToken);

        return !overlap;
    }

    public async Task<bool> HasActiveScheduleByClassSectionIdAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        var dateOnly = DateOnly.FromDateTime(DateTime.Now);

        return await dbContext.Schedules
            .AsNoTracking()
            .AnyAsync(s => s.ClassSectionId == classSectionId &&
                           s.StartDate <= dateOnly &&
                           s.EndDate >= dateOnly,
                cancellationToken);
    }

    public async Task<bool> HasActiveScheduleInTermByRoomIdAsync(Guid roomId, CancellationToken cancellationToken)
    {
        var dateOnly = DateOnly.FromDateTime(DateTime.Now);

        return await dbContext.Schedules
            .AsNoTracking()
            .AnyAsync(s => s.RoomId == roomId &&
                           s.StartDate <= dateOnly &&
                           s.EndDate >= dateOnly &&
                           !s.IsDeleted,
                cancellationToken);
    }

    public async Task<bool> HasActiveScheduleInTermAsync(Guid courseId, CancellationToken cancellationToken)
    {
        var dateOnly = DateOnly.FromDateTime(DateTime.Now);

        return await dbContext.Schedules
            .AsNoTracking()
            .Include(s => s.ClassSection)
            .AnyAsync(s => s.ClassSection!.CourseId == courseId &&
                           s.StartDate <= dateOnly &&
                           s.EndDate >= dateOnly &&
                           !s.IsDeleted,
                cancellationToken);
    }

    public async Task<bool> IsBookedScheduleByRoomIdAsync(Guid roomId, CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .IgnoreQueryFilters()
            .AnyAsync(s => s.RoomId == roomId, cancellationToken);
    }

    public async Task<List<Schedule>> GetSchedulesByClassSectionIdAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .AsNoTracking()
            .Where(s => s.ClassSectionId == classSectionId)
            .Include(s => s.ClassSection)
            .Include(s => s.Room)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ScheduleWithRoomDto>> GetActiveSchedulesByClassSectionIdsAndDayAsync(
        List<Guid> classSectionIds, WeekDayEnum dayOfWeek, DateOnly date, CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .AsNoTracking()
            .Where(s => classSectionIds.Contains(s.ClassSectionId) &&
                        s.WeekDay == dayOfWeek &&
                        s.StartDate <= date &&
                        s.EndDate >= date)
            .Include(s => s.Room)
            .Select(s => new ScheduleWithRoomDto
            {
                Id = s.Id,
                ClassSectionId = s.ClassSectionId,
                RoomId = s.RoomId,
                RoomName = s.Room!.RoomName,
                Building = s.Room.Building,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay,
                StartDate = s.StartDate,
                EndDate = s.EndDate
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ScheduleProjectionDto>> GetSchedulesByClassSectionIdsAndDateAsync(
        List<Guid> classSectionIds,
        DateOnly date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .AsNoTracking()
            .Where(s => classSectionIds.Contains(s.ClassSectionId) &&
                        s.WeekDay == weekDay &&
                        s.StartDate <= date &&
                        s.EndDate >= date)
            .Select(s => new ScheduleProjectionDto
            {
                ScheduleId = s.Id,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay,
                ClassSectionId = s.ClassSection!.Id,
                SectionCode = s.ClassSection.SectionCode,
                CourseId = s.ClassSection.Course!.Id,
                CourseCode = s.ClassSection.Course.Code,
                CourseName = s.ClassSection.Course.Name,
                RoomId = s.Room!.Id,
                RoomName = s.Room.RoomName,
                Building = s.Room.Building
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ScheduleDetailsWithRelationsDto?> GetScheduleDetailsWithRelationsAsync(Guid scheduleId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .AsNoTracking()
            .Where(s => s.Id == scheduleId)
            .Include(s => s.Room)
            .Include(s => s.ClassSection)
            .ThenInclude(cs => cs.Course)
            .Select(s => new ScheduleDetailsWithRelationsDto
            {
                ScheduleId = s.Id,
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay,

                ClassSectionId = s.ClassSectionId,
                SectionCode = s.ClassSection.SectionCode,

                CourseName = s.ClassSection.Course != null ? s.ClassSection.Course.Name : string.Empty,

                RoomId = s.RoomId,
                RoomName = s.Room != null ? s.Room.RoomName : string.Empty,
                Building = s.Room != null ? s.Room.Building : string.Empty
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<Schedule>> GetSchedulesByDateAsync(DateOnly date,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .Where(s => s.StartDate <= date &&
                        s.EndDate >= date)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<LecturerDailyReportScheduleProjectionDto>> GetLecturerReportSchedulesForDateAsync(
        Guid lecturerId,
        DateTime date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken)
    {
        var dateOnly = DateOnly.FromDateTime(date);

        return await dbContext.Schedules
            .Where(s => s.ClassSection!.LecturerId == lecturerId
                        && s.WeekDay == weekDay
                        && s.StartDate <= dateOnly
                        && s.EndDate >= dateOnly)
            .Select(s => new LecturerDailyReportScheduleProjectionDto
            {
                ScheduleId = s.Id,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay,

                ClassSectionId = s.ClassSection!.Id,
                SectionCode = s.ClassSection.SectionCode,
                LecturerId = s.ClassSection.LecturerId,

                CourseId = s.ClassSection.Course!.Id,
                CourseCode = s.ClassSection.Course.Code,
                CourseName = s.ClassSection.Course.Name,

                RoomId = s.Room!.Id,
                RoomName = s.Room.RoomName,
                Building = s.Room.Building
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ClassDetailProjectionDto?> GetScheduleDetailsForClassSectionAsync(Guid classSectionId,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .Where(s => s.ClassSectionId == classSectionId)
            .Select(s => new ClassDetailProjectionDto
            {
                CourseName = s.ClassSection!.Course!.Name,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                Building = s.Room!.Building
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<Schedule>> GetSchedulesByClassSectionIdAndDateAsync(Guid classSectionId, DateTime date,
        WeekDayEnum weekDay, CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .Include(s => s.ClassSection)
            .ThenInclude(cs => cs.Course)
            .Include(s => s.Room)
            .Where(s => s.ClassSectionId == classSectionId &&
                        s.WeekDay == weekDay &&
                        s.StartDate <= DateOnly.FromDateTime(date) &&
                        s.EndDate >= DateOnly.FromDateTime(date))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<ScheduleProjectionDto>> GetLecturerSchedulesForDateAsync(
        Guid lecturerId,
        DateTime date,
        WeekDayEnum weekDay,
        CancellationToken cancellationToken)
    {
        var dateOnly = DateOnly.FromDateTime(date);

        return await dbContext.Schedules
            .Where(s => s.ClassSection!.LecturerId == lecturerId
                        && s.WeekDay == weekDay
                        && s.StartDate <= dateOnly
                        && s.EndDate >= dateOnly)
            .Select(s => new ScheduleProjectionDto
            {
                ScheduleId = s.Id,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay,
                ClassSectionId = s.ClassSection!.Id,
                SectionCode = s.ClassSection.SectionCode,
                CourseId = s.ClassSection.Course!.Id,
                CourseCode = s.ClassSection.Course.Code,
                CourseName = s.ClassSection.Course.Name,
                RoomId = s.Room!.Id,
                RoomName = s.Room.RoomName,
                Building = s.Room.Building
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Schedule>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Schedules.Where(s => !s.IsDeleted).ToListAsync(cancellationToken);
    }

    public async Task<Schedule?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Schedules.Where(s => !s.IsDeleted)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task AddAsync(Schedule entity, CancellationToken cancellationToken)
    {
        await dbContext.Schedules.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Schedule> entities, CancellationToken cancellationToken)
    {
        await dbContext.Schedules.AddRangeAsync(entities, cancellationToken);
    }

    public async Task UpdateAsync(Schedule entity, CancellationToken cancellationToken)
    {
        dbContext.Schedules.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Schedule entity, CancellationToken cancellationToken)
    {
        dbContext.Schedules.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> IsLecturerAvailableAsync(Guid lecturerId, WeekDayEnum weekDay, TimeOnly startTime,
        TimeOnly endTime, CancellationToken cancellationToken)
    {
        var overlap = await dbContext.Schedules
            .Include(s => s.ClassSection)
            .ThenInclude(cs => cs!.Course)
            .Include(s => s.Room)
            .AnyAsync(s => s.ClassSection!.LecturerId == lecturerId &&
                           s.WeekDay == weekDay &&
                           s.StartTime < endTime &&
                           s.EndTime > startTime &&
                           !s.IsDeleted,
                cancellationToken);

        return !overlap;
    }

    public async Task<bool> IsRoomAvailableAsync(Guid roomId, WeekDayEnum weekDay, TimeOnly startTime,
        TimeOnly endTime, DateOnly startDate, DateOnly endDate, CancellationToken cancellationToken)
    {
        var overlap = await dbContext.Schedules
            .AnyAsync(s => s.RoomId == roomId &&
                           s.WeekDay == weekDay &&
                           s.StartTime < endTime &&
                           s.EndTime > startTime &&
                           (s.StartDate < endDate || s.EndDate > startDate) &&
                           !s.IsDeleted,
                cancellationToken);

        return !overlap;
    }

    public async Task<Tuple<List<Schedule>, int>> GetPagedSchedulesAsync(ScheduleListCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Schedules
            .Where(s => !s.IsDeleted)
            .Include(s => s.ClassSection)
            .ThenInclude(cs => cs.Course)
            .AsQueryable();

        if (criteria.LecturerId.HasValue)
            query = query.Where(s => s.ClassSection!.LecturerId == criteria.LecturerId.Value);

        if (criteria.ClassSectionId.HasValue)
            query = query.Where(s => s.ClassSectionId == criteria.ClassSectionId.Value);

        if (criteria.RoomId.HasValue)
            query = query.Where(s => s.RoomId == criteria.RoomId.Value);

        if (criteria.WeekDay != null)
            query = query.Where(s => s.WeekDay.Id == criteria.WeekDay.Id);

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(criteria.SortBy))
        {
            Expression<Func<Schedule, object>> orderExpr = criteria.SortBy.ToLower() switch
            {
                "coursename" => s => s.ClassSection!.Course!.Name,
                "roomname" => s => s.Room!.RoomName,
                "starttime" => s => s.StartTime,
                "endtime" => s => s.EndTime,
                "weekday" => s => s.WeekDay,
                _ => s => s.StartTime
            };

            query = criteria.SortOrder?.ToLower() == "desc"
                ? query.OrderByDescending(orderExpr)
                : query.OrderBy(orderExpr);
        }
        else
        {
            query = query.OrderBy(s => s.WeekDay).ThenBy(s => s.StartTime);
        }

        var schedules = await query
            .Skip((criteria.PageNumber - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return Tuple.Create(schedules, totalCount);
    }

    public async Task<Tuple<List<Schedule>, int>> GetPagedSchedulesWithIncludesAsync(ScheduleListCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Schedules
            .Where(s => !s.IsDeleted)
            .Include(s => s.ClassSection)
            .ThenInclude(cs => cs!.Course)
            .Include(s => s.Room)
            .AsQueryable();

        if (criteria.LecturerId.HasValue)
            query = query.Where(s => s.ClassSection!.LecturerId == criteria.LecturerId.Value);

        if (criteria.ClassSectionId.HasValue)
            query = query.Where(s => s.ClassSectionId == criteria.ClassSectionId.Value);

        if (criteria.RoomId.HasValue)
            query = query.Where(s => s.RoomId == criteria.RoomId.Value);

        if (criteria.WeekDay != null)
            query = query.Where(s => s.WeekDay.Id == criteria.WeekDay.Id);

        if (!string.IsNullOrWhiteSpace(criteria.SearchTerm))
        {
            var st = criteria.SearchTerm.ToLower();
            query = query.Where(s =>
                s.ClassSection!.Course!.Name.ToLower().Contains(st) ||
                s.ClassSection!.Course!.Code.ToLower().Contains(st) ||
                s.Room!.RoomName.ToLower().Contains(st) ||
                s.Room!.Building.ToLower().Contains(st));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(criteria.SortBy))
            query = criteria.SortBy.ToLower() switch
            {
                "coursename" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.ClassSection!.Course!.Name)
                    : query.OrderBy(s => s.ClassSection!.Course!.Name),
                "roomname" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.Room!.RoomName)
                    : query.OrderBy(s => s.Room!.RoomName),
                "starttime" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.StartTime)
                    : query.OrderBy(s => s.StartTime),
                "endtime" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.EndTime)
                    : query.OrderBy(s => s.EndTime),
                "weekday" => criteria.SortOrder?.ToLower() == "desc"
                    ? query.OrderByDescending(s => s.WeekDay)
                    : query.OrderBy(s => s.WeekDay),
                _ => query.OrderBy(s => s.WeekDay).ThenBy(s => s.StartTime)
            };
        else
            query = query.OrderBy(s => s.WeekDay).ThenBy(s => s.StartTime);

        var schedules = await query
            .Skip((criteria.PageNumber - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return Tuple.Create(schedules, totalCount);
    }

    public async Task<Schedule?> GetByIdWithClassSectionAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .Include(s => s.ClassSection)
            .Where(s => !s.IsDeleted)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task SoftDeleteAsync(Schedule entity, CancellationToken cancellationToken)
    {
        entity.Delete();
        dbContext.Schedules.Update(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<List<Schedule>> GetSchedulesByClassSectionIdsAsync(
        List<Guid> classSectionIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Schedules
            .AsNoTracking()
            .Where(s => classSectionIds.Contains(s.ClassSectionId))
            .Include(s => s.ClassSection)
            .Include(s => s.Room)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteRangeAsync(IEnumerable<Schedule> entities, CancellationToken cancellationToken)
    {
        dbContext.Schedules.RemoveRange(entities);
        await SaveChangesAsync(cancellationToken);
    }
}
