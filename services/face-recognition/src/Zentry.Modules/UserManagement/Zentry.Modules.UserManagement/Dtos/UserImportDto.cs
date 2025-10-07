using CsvHelper.Configuration;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.UserManagement.Dtos;

public class UserImportDto : BaseImportDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Role { get; set; } = "User";
}

public sealed class UserImportDtoMap : ClassMap<UserImportDto>
{
    public UserImportDtoMap()
    {
        Map(m => m.Email).Name("Email", "email", "emailaddress");
        Map(m => m.Password).Name("Password", "password");
        Map(m => m.FullName).Name("FullName", "fullname", "name");
        Map(m => m.PhoneNumber).Name("PhoneNumber", "phonenumber", "phone").Optional();
        Map(m => m.Role).Name("Role", "role").Optional().Default("User");
    }
}
