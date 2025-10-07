using Microsoft.EntityFrameworkCore;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.Modules.UserManagement.Persistence.DbContext;
using Zentry.SharedKernel.Constants.Attendance;

namespace Zentry.Modules.UserManagement.Persistence.Repositories;

public class UserRequestRepository(UserDbContext dbContext) : IUserRequestRepository
{
    public async Task<(List<UserRequest> userRequests, int totalCount)> GetUserRequestsAsync(
        int pageNumber,
        int pageSize,
        string? status,
        string? requestType,
        CancellationToken cancellationToken)
    {
        var query = dbContext.UserRequests.AsNoTracking();

        if (!string.IsNullOrEmpty(status))
            try
            {
                var requestStatus = RequestStatus.FromName(status);
                query = query.Where(ur => ur.Status == requestStatus);
            }
            catch (InvalidOperationException)
            {
            }

        // Lọc theo loại yêu cầu
        if (!string.IsNullOrEmpty(requestType))
            try
            {
                var requestTypeName = RequestType.FromName(requestType);
                query = query.Where(ur => ur.RequestType == requestTypeName);
            }
            catch (InvalidOperationException)
            {
                // Bỏ qua lọc nếu requestType không hợp lệ
            }

        var totalCount = await query.Where(ur => ur.Status == RequestStatus.Pending).CountAsync(cancellationToken);

        var userRequests = await query
            .Where(ur => ur.Status == RequestStatus.Pending)
            .OrderByDescending(ur => ur.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (userRequests, totalCount);
    }

    public async Task AddAsync(UserRequest userRequest, CancellationToken cancellationToken)
    {
        await dbContext.UserRequests.AddAsync(userRequest, cancellationToken);
    }

    public Task AddRangeAsync(IEnumerable<UserRequest> entities, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<UserRequest>> GetAllAsync(CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public async Task<UserRequest?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        return await dbContext.UserRequests.FirstOrDefaultAsync(ur => ur.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(UserRequest userRequest, CancellationToken cancellationToken)
    {
        dbContext.UserRequests.Update(userRequest);
    }

    public Task DeleteAsync(UserRequest entity, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}