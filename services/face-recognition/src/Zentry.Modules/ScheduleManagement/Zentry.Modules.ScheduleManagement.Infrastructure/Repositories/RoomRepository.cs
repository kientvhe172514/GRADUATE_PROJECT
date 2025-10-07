using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Features.Rooms.GetRooms;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;

namespace Zentry.Modules.ScheduleManagement.Infrastructure.Repositories;

public class RoomRepository(ScheduleDbContext dbContext) : IRoomRepository
{
    public async Task<int> CountTotalRoomsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Rooms.Where(r => !r.IsDeleted).CountAsync(cancellationToken);
    }

    public async Task<List<Room>> GetByRoomNamesAsync(List<string> roomNames, CancellationToken cancellationToken)
    {
        return await dbContext.Rooms
            .Where(r => roomNames.Contains(r.RoomName) && !r.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Room entity, CancellationToken cancellationToken)
    {
        await dbContext.Rooms.AddAsync(entity, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<Room> entities, CancellationToken cancellationToken)
    {
        await dbContext.Rooms.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<IEnumerable<Room>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Rooms.Where(r => !r.IsDeleted).ToListAsync(cancellationToken);
    }

    public async Task<Room?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.Rooms
            .Where(r => !r.IsDeleted)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<bool> IsRoomNameUniqueAsync(string roomName, string building, CancellationToken cancellationToken)
    {
        return !await dbContext.Rooms.AnyAsync(r => r.RoomName == roomName && r.Building == building && !r.IsDeleted,
            cancellationToken);
    }

    public async Task<bool> IsRoomNameUniqueExcludingSelfAsync(Guid roomId, string? roomName, string building,
        CancellationToken cancellationToken)
    {
        return !await dbContext.Rooms.AnyAsync(
            r => r.Id != roomId && r.RoomName == roomName && r.Building == building && !r.IsDeleted,
            cancellationToken);
    }

    public async Task SoftDeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        var room = await dbContext.Rooms.FindAsync([id], cancellationToken);

        if (room is not null)
        {
            room.Delete();
            dbContext.Rooms.Update(room);
            await SaveChangesAsync(cancellationToken);
        }
    }

    public async Task DeleteAsync(Room entity, CancellationToken cancellationToken)
    {
        dbContext.Rooms.Remove(entity);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Room entity, CancellationToken cancellationToke)
    {
        dbContext.Rooms.Update(entity);
        await SaveChangesAsync(cancellationToke);
    }

    public async Task<Tuple<List<Room>, int>> GetPagedRoomsAsync(RoomListCriteria criteria,
        CancellationToken cancellationToken)
    {
        var query = dbContext.Rooms.Where(r => !r.IsDeleted).AsQueryable();

        if (!string.IsNullOrWhiteSpace(criteria.SearchTerm))
            query = query.Where(r =>
                r.RoomName.Contains(criteria.SearchTerm) ||
                r.Building.Contains(criteria.SearchTerm)
            );

        if (!string.IsNullOrWhiteSpace(criteria.Building))
            query = query.Where(r => r.Building == criteria.Building);

        var totalCount = await query.CountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(criteria.SortBy))
        {
            Expression<Func<Room, object>> orderByExpression = criteria.SortBy.ToLower() switch
            {
                "roomname" => r => r.RoomName,
                "building" => r => r.Building,
                "createdat" => r => r.CreatedAt,
                _ => r => r.CreatedAt
            };

            query = criteria.SortOrder?.ToLower() == "desc"
                ? query.OrderByDescending(orderByExpression)
                : query.OrderBy(orderByExpression);
        }
        else
        {
            query = query.OrderByDescending(r => r.CreatedAt);
        }

        var rooms = await query
            .Skip((criteria.PageNumber - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return Tuple.Create(rooms, totalCount);
    }
}