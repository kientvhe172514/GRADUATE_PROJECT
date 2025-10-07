using CsvHelper.Configuration;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Services;

public class ScheduleFileProcessor : GenericFileProcessor<ScheduleImportDto>
{
    protected override string[] RequiredHeaders => new[]
    {
        "sectioncode", "roomname", "startdate", "enddate", "starttime", "endtime", "weekday"
    };

    protected override ClassMap<ScheduleImportDto>? CsvClassMap => new ScheduleImportDtoMap();
}