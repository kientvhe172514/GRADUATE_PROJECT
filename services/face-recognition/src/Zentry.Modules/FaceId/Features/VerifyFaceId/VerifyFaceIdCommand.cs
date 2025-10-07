using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.VerifyFaceId;

public class VerifyFaceIdCommand : ICommand<VerifyFaceIdResponse>
{
    public VerifyFaceIdCommand(Guid userId, float[] embeddingArray, float threshold = 0.7f, Guid? requestId = null)
    {
        UserId = userId;
        EmbeddingArray = embeddingArray;
        Threshold = threshold;
        RequestId = requestId;
    }

    public Guid UserId { get; init; }
    public float[] EmbeddingArray { get; init; }
    public float Threshold { get; init; }
    public Guid? RequestId { get; init; }
}

public class VerifyFaceIdResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("o");
    public float Similarity { get; set; }
}