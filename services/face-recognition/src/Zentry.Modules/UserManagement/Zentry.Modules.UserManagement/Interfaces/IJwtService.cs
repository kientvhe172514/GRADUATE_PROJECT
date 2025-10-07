namespace Zentry.Modules.UserManagement.Interfaces;

public interface IJwtService
{
    string GenerateToken(Guid userId, string email, string fullName, string role);
}