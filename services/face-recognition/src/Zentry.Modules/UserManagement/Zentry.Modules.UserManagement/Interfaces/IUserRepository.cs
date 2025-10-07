using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Entities;
using Zentry.SharedKernel.Abstractions.Data;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.Modules.UserManagement.Interfaces;

public interface IUserRepository : IRepository<User, Guid>
{
    Task AddRangeAsync(IEnumerable<Account> accounts, IEnumerable<User> users, CancellationToken cancellationToken);
    Task<List<string>> GetExistingEmailsAsync(List<string> emails);
    Task<bool> ExistsByIdAsync(Guid userId, CancellationToken cancellationToken);
    Task AddAsync(Account account, User user, CancellationToken cancellationToken);
    Task<bool> IsExistsByEmail(Guid? id, string email);
    Task<Role> GetUserRoleByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<Account?> GetAccountById(Guid accountId);
    Task<Account?> GetAccountByUserId(Guid userId);
    Task UpdateAccountAsync(Account account, CancellationToken cancellationToken);

    Task<(IEnumerable<UserListItemDto> Users, int TotalCount)> GetUsersAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm,
        Role? role,
        string? status);

    Task SoftDeleteUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<List<User>> GetUsersByIdsAsync(List<Guid> userIds, CancellationToken cancellationToken);

    Task<List<(Guid UserId, Role Role)>> GetUserRolesByUserIdsAsync(List<Guid> userIds,
        CancellationToken cancellationToken);

    Task<bool> IsPhoneNumberExist(Guid id, string phone, CancellationToken cancellationToken);
}