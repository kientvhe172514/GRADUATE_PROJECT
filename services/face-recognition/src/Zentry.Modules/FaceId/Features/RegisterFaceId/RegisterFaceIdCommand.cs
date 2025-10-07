using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.RegisterFaceId;

public class RegisterFaceIdCommand : ICommand<RegisterFaceIdResponse>
{
    public RegisterFaceIdCommand(Guid userId, float[] embeddingArray)
    {
        UserId = userId;
        EmbeddingArray = embeddingArray;
    }

    public Guid UserId { get; init; }
    public float[] EmbeddingArray { get; init; }
}

public class RegisterFaceIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
}