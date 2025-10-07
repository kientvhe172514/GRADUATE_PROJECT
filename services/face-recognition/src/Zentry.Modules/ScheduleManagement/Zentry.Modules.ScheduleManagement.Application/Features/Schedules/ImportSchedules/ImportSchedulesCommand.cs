using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.ImportSchedules;

public class ImportSchedulesCommand(List<ScheduleImportDto> schedulesToImport) : ICommand<ImportSchedulesResponse>
{
    public List<ScheduleImportDto> SchedulesToImport { get; } = schedulesToImport;
}

public class ImportSchedulesResponse
{
    public bool Success => Errors.Count == 0;
    public int ImportedCount { get; set; }
    public int FailedCount { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    public int RowIndex { get; set; }
    public string? Identifier { get; set; } // SectionCode + RoomName
    public string Message { get; set; }
}