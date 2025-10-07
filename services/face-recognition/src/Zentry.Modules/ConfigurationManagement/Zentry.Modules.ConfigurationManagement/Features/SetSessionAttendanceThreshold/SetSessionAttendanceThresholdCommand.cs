using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.SetSessionAttendanceThreshold;

public class SetSessionAttendanceThresholdCommand : ICommand<SetSessionAttendanceThresholdResponse>
{
    public Guid SessionId { get; set; }

    [Range(0.0, 100.0, ErrorMessage = "Threshold must be between 0 and 100")]
    public double ThresholdPercentage { get; set; }
}

public class SetSessionAttendanceThresholdRequest
{
    [Required]
    [Range(0.0, 100.0, ErrorMessage = "Threshold percentage must be between 0 and 100")]
    public double ThresholdPercentage { get; set; }
}

public class SetSessionAttendanceThresholdResponse
{
    public Guid SettingId { get; set; }
    public Guid SessionId { get; set; }
    public double ThresholdPercentage { get; set; }
    public string Action { get; set; } = string.Empty; // "Created" or "Updated"
    public DateTime Timestamp { get; set; }
    public string SessionStatus { get; set; } = string.Empty;
}