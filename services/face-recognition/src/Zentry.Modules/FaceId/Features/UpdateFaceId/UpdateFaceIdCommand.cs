using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.UpdateFaceId;

public class UpdateFaceIdCommand : ICommand<UpdateFaceIdResponse>
{
    public UpdateFaceIdCommand(int userId, float[] embeddingArray)
    {
        UserId = userId;
        EmbeddingArray = embeddingArray;
    }

    public int UserId { get; init; }
    public float[] EmbeddingArray { get; init; }
}

public class UpdateFaceIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
}