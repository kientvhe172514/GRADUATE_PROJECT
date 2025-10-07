using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.UpdateFaceId;

public class UpdateFaceIdCommand : ICommand<UpdateFaceIdResponse>
{
    public UpdateFaceIdCommand(Guid userId, bool hasFaceId)
    {
        UserId = userId;
        HasFaceId = hasFaceId;
    }

    public Guid UserId { get; init; }
    public bool HasFaceId { get; init; }
}

public class UpdateFaceIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime? LastUpdated { get; set; }
}