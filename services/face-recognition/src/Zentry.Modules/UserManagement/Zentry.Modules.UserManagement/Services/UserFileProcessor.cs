using CsvHelper.Configuration;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.UserManagement.Services;

public class UserFileProcessor : GenericFileProcessor<UserImportDto>
{
    protected override string[] RequiredHeaders => ["email", "password", "fullname"];

    protected override ClassMap<UserImportDto>? CsvClassMap => new UserImportDtoMap();
}