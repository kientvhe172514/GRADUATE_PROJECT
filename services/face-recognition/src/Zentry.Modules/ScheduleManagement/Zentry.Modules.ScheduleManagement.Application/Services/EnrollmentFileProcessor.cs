using CsvHelper.Configuration;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Services;

public class EnrollmentFileProcessor : GenericFileProcessor<EnrollmentImportDto>
{
    protected override string[] RequiredHeaders => new[]
    {
        "studentcode", "classsectioncode"
    };

    protected override ClassMap<EnrollmentImportDto>? CsvClassMap => new EnrollmentImportDtoMap();
}

public sealed class EnrollmentImportDtoMap : ClassMap<EnrollmentImportDto>
{
    public EnrollmentImportDtoMap()
    {
        Map(m => m.StudentCode).Name("studentcode");
        Map(m => m.ClassSectionCode).Name("classsectioncode");
    }
}