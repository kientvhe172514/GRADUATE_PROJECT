using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class EnrollmentImportDto : BaseImportDto
{
    public string StudentCode { get; set; } = string.Empty;
    public string ClassSectionCode { get; set; } = string.Empty;
}