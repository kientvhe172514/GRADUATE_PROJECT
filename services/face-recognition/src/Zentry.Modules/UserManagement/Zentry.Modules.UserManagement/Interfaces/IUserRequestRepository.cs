using Zentry.Modules.UserManagement.Entities;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.UserManagement.Interfaces;

public interface IUserRequestRepository : IRepository<UserRequest, Guid>
{
    Task<(List<UserRequest> userRequests, int totalCount)> GetUserRequestsAsync(
        int pageNumber,
        int pageSize,
        string? status,
        string? requestType,
        CancellationToken cancellationToken);
}