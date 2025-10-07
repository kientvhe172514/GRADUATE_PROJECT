using Microsoft.EntityFrameworkCore;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.Modules.UserManagement.Persistence.DbContext;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Persistence.Repositories;

public class UserRepository(UserDbContext dbContext) : IUserRepository
{
    public async Task AddRangeAsync(IEnumerable<Account> accounts, IEnumerable<User> users,
        CancellationToken cancellationToken)
    {
        await dbContext.Accounts.AddRangeAsync(accounts, cancellationToken);
        await dbContext.Users.AddRangeAsync(users, cancellationToken);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<List<string>> GetExistingEmailsAsync(List<string> emails)
    {
        return await dbContext.Accounts
            .Where(a => emails.Contains(a.Email))
            .Select(a => a.Email)
            .ToListAsync();
    }

    public async Task<List<(Guid UserId, Role Role)>> GetUserRolesByUserIdsAsync(
        List<Guid> userIds, CancellationToken cancellationToken)
    {
        return await dbContext.Accounts
            .AsNoTracking()
            .Join(dbContext.Users,
                account => account.Id,
                user => user.AccountId,
                (account, user) => new { Account = account, User = user })
            .Where(joined => userIds.Contains(joined.User.Id) && joined.Account.Status == AccountStatus.Active)
            .Select(joined => new
            {
                joined.User.Id, // UserId
                joined.Account.Role // Role (Smart Enum)
            })
            .ToListAsync(cancellationToken)
            .ContinueWith(t => t.Result.Select(x => (x.Id, x.Role)).ToList(), cancellationToken);
    }

    public async Task<bool> IsPhoneNumberExist(Guid id, string phone, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user is null)
            throw new ResourceNotFoundException("USER", id);
        var account = await dbContext.Accounts.AnyAsync(a => a.Id == user.AccountId && a.Status == AccountStatus.Active,
            cancellationToken);
        if (!account)
            throw new ResourceNotFoundException("USER", id);
        return await dbContext.Users.AnyAsync(u => u.PhoneNumber == phone, cancellationToken);
    }

    public async Task<List<User>> GetUsersByIdsAsync(List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        return await dbContext.Users
            .AsNoTracking()
            .Include(u => u.Account) // Cần include Account để lấy Email nếu Email không có trong User
            .Where(u => userIds.Contains(u.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<Role> GetUserRoleByUserIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var role = await dbContext.Accounts
            .AsNoTracking()
            .Join(dbContext.Users,
                account => account.Id,
                user => user.AccountId,
                (account, user) => new { Account = account, User = user })
            .Where(joined => joined.User.Id == userId && joined.Account.Status == AccountStatus.Active)
            .Select(joined => joined.Account.Role)
            .FirstOrDefaultAsync(cancellationToken);

        return role ?? throw new NotFoundException(nameof(Role), userId);
    }

    public async Task<bool> ExistsByIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            throw new ResourceNotFoundException("USER", userId);
        var account = await dbContext.Accounts.AnyAsync(a => a.Id == user.AccountId && a.Status == AccountStatus.Active,
            cancellationToken);
        return !account ? throw new ResourceNotFoundException("USER", userId) : true;
    }

    public async Task AddAsync(Account account, User user, CancellationToken cancellationToken)
    {
        await dbContext.Accounts.AddAsync(account, cancellationToken);
        await dbContext.Users.AddAsync(user, cancellationToken);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<User> entities, CancellationToken cancellationToken)
    {
        await dbContext.Users.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<bool> IsExistsByEmail(Guid? id, string email)
    {
        if (id == null) return await dbContext.Accounts.AnyAsync(a => a.Email == email);
        {
            return await dbContext.Accounts.AnyAsync(a => a.Id != id && a.Email == email);
        }
    }


    public async Task<Account?> GetAccountById(Guid accountId)
    {
        return await dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == accountId);
    }

    public async Task<Account?> GetAccountByUserId(Guid userId)
    {
        return await dbContext.Accounts
            .Join(dbContext.Users,
                account => account.Id,
                user => user.AccountId,
                (account, user) => new { Account = account, User = user })
            .Where(joined => joined.User.Id == userId)
            .Select(joined => joined.Account)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateAccountAsync(Account account, CancellationToken cancellationToken)
    {
        dbContext.Accounts.Update(account);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<(IEnumerable<UserListItemDto> Users, int TotalCount)> GetUsersAsync(
        int pageNumber,
        int pageSize,
        string? searchTerm,
        Role? role,
        string? status)
    {
        var query = from u in dbContext.Users
            join a in dbContext.Accounts on u.AccountId equals a.Id
            select new { User = u, Account = a };

        // Áp dụng lọc
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerSearchTerm = searchTerm.ToLower();
            query = query.Where(x =>
                x.Account.Email.Contains(lowerSearchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                x.User.FullName.Contains(lowerSearchTerm, StringComparison.CurrentCultureIgnoreCase));
        }

        if (role != null)
            query = query.Where(x => x.Account.Role == role);

        // ✅ SỬA: Filter cho Smart Enum
        if (!string.IsNullOrWhiteSpace(status))
            try
            {
                var statusEnum = AccountStatus.FromName(status);
                query = query.Where(x => x.Account.Status == statusEnum);
            }
            catch (InvalidOperationException)
            {
            }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(x => x.Account.Email)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserListItemDto
            {
                UserId = x.User.Id,
                Email = x.Account.Email,
                FullName = x.User.FullName,
                Role = x.Account.Role.ToString(),
                Status = x.Account.Status.ToString(),
                CreatedAt = x.Account.CreatedAt
            })
            .ToListAsync();

        return (users, totalCount);
    }

    public async Task SoftDeleteUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
            throw new ResourceNotFoundException($"User with ID '{userId}' not found.");

        var account =
            await dbContext.Accounts.FirstOrDefaultAsync(a => a.Id == user.AccountId,
                cancellationToken);
        if (account is null)
            throw new ResourceNotFoundException($"Associated account for user ID '{userId}' not found.");

        account.UpdateStatus(AccountStatus.Inactive);

        dbContext.Accounts.Update(account);
        await SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<User>> GetAllAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Users.ToListAsync(cancellationToken);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(u => u.Account)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
        if (user?.Account is null || Equals(user?.Account.Status, AccountStatus.Inactive)) return null;

        return user;
    }


    public Task AddAsync(User entity, CancellationToken cancellationToken)
    {
        throw new NotSupportedException("Use Add(Account, User) for creating new users with accounts.");
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken)
    {
        dbContext.Users.Update(user);
        await SaveChangesAsync(cancellationToken);
    }

    public Task DeleteAsync(User entity, CancellationToken cancellationToken)
    {
        throw new NotSupportedException("Use Add(Account, User) for creating new users with accounts.");
    }


    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}