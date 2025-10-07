using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.StartRound;

public class StartRoundCommand : ICommand<StartRoundResponse>
{
    public Guid SessionId { get; set; }
    public Guid RoundId { get; set; }
    public Guid LecturerId { get; set; }
    public bool RequireFaceVerification { get; set; } = true;
}

public class StartRoundResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public Guid RoundId { get; set; }
    public int RoundNumber { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}