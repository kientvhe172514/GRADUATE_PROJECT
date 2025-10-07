using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.ImportEnrollments;

public class ImportEnrollmentsCommand(List<EnrollmentImportDto> enrollmentsToImport)
    : ICommand<ImportEnrollmentsResponse>
{
    public List<EnrollmentImportDto> EnrollmentsToImport { get; } = enrollmentsToImport;
}

public class ImportEnrollmentsResponse
{
    public bool Success => Errors.Count == 0;
    public int ImportedCount { get; set; }
    public int FailedCount { get; set; }
    public List<ImportError> Errors { get; set; } = new();
}

public class ImportError
{
    public int RowIndex { get; set; }
    public string? Identifier { get; set; }
    public string Message { get; set; }
}