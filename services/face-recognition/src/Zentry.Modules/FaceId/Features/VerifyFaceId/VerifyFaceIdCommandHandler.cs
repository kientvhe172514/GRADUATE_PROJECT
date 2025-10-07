using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.VerifyFaceId;

public class VerifyFaceIdCommandHandler : ICommandHandler<VerifyFaceIdCommand, VerifyFaceIdResponse>
{
    private readonly IFaceIdRepository _faceIdRepository;

    public VerifyFaceIdCommandHandler(IFaceIdRepository faceIdRepository)
    {
        _faceIdRepository = faceIdRepository;
    }

    public async Task<VerifyFaceIdResponse> Handle(VerifyFaceIdCommand command, CancellationToken cancellationToken)
    {
        try
        {
            // Check if user has a face ID
            var exists = await _faceIdRepository.ExistsByUserIdAsync(command.UserId, cancellationToken);
            if (!exists)
                return new VerifyFaceIdResponse
                {
                    Success = false,
                    Message = "User does not have a registered Face ID."
                };

            // Verify embedding against stored one (now accepts float[] directly)
            var (isMatch, similarity) = await _faceIdRepository.VerifyAsync(
                command.UserId,
                command.EmbeddingArray,
                command.Threshold,
                cancellationToken);

            // If this verify is tied to a request, we could persist result (optional: handled at controller level)
            // This handler remains pure to keep cross-module deps low.

            return new VerifyFaceIdResponse
            {
                Success = isMatch,
                Message = isMatch ? "Face ID verified successfully" : "Face ID verification failed",
                Similarity = similarity
            };
        }
        catch (Exception ex)
        {
            return new VerifyFaceIdResponse
            {
                Success = false,
                Message = $"Error verifying Face ID: {ex.Message}"
            };
        }
    }
}