using MediatR;
using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.UpdateFaceId;

public class UpdateFaceIdCommandHandler : ICommandHandler<UpdateFaceIdCommand, UpdateFaceIdResponse>
{
    private const float UpdateSimilarityThreshold = 0.7f;
    private readonly IFaceIdRepository _faceIdRepository;
    private readonly IMediator _mediator;

    public UpdateFaceIdCommandHandler(IFaceIdRepository faceIdRepository, IMediator mediator)
    {
        _faceIdRepository = faceIdRepository;
        _mediator = mediator;
    }

    public async Task<UpdateFaceIdResponse> Handle(UpdateFaceIdCommand command, CancellationToken cancellationToken)
    {
        try
        {
            // Check if user has a face ID
            var exists = await _faceIdRepository.ExistsByUserIdAsync(command.UserId, cancellationToken);
            if (!exists)
                return new UpdateFaceIdResponse
                {
                    Success = false,
                    Message = "User does not have a registered Face ID. Use register instead."
                };

            // Verify similarity with existing embedding before allowing update (now accepts float[] directly)
            var (isMatch, similarity) = await _faceIdRepository.VerifyAsync(
                command.UserId,
                command.EmbeddingArray,
                UpdateSimilarityThreshold,
                cancellationToken);

            if (!isMatch)
                return new UpdateFaceIdResponse
                {
                    Success = false,
                    Message =
                        $"Face ID update rejected: similarity {similarity:F3} below threshold {UpdateSimilarityThreshold}"
                };

            // ✅ NEW: Check if this face embedding already exists for ANOTHER user
            var (isDuplicate, existingUserId, dupSimilarity) = await _faceIdRepository.CheckDuplicateFaceAsync(
                command.EmbeddingArray, 
                excludeUserId: command.UserId, // Exclude current user from duplicate check
                similarityThreshold: 0.85f, 
                cancellationToken);

            if (isDuplicate)
            {
                Console.WriteLine($"❌ [UpdateFaceIdCommandHandler] DUPLICATE FACE REJECTED!");
                Console.WriteLine($"   Update attempted for userId: {command.UserId}");
                Console.WriteLine($"   Face already registered for userId: {existingUserId}");
                Console.WriteLine($"   Similarity: {dupSimilarity:F4}");
                
                return new UpdateFaceIdResponse
                {
                    Success = false,
                    Message = $"This face is already registered for another user (User ID: {existingUserId}). Each person can only have one account. Similarity: {dupSimilarity:F2}"
                };
            }

            // Update embedding in database (now accepts float[] directly)
            await _faceIdRepository.UpdateAsync(command.UserId, command.EmbeddingArray, cancellationToken);

            Console.WriteLine($"✅ [UpdateFaceIdCommandHandler] Face updated successfully for userId: {command.UserId}");

            // ❌ COMMENT: Update user's face ID status - Service auth/employee riêng xử lý
            // TODO: Gọi API sang service auth/employee để update LastUpdated timestamp qua HTTP/RabbitMQ
            // var updateFaceIdCommand =
            //     new UserManagement.Features.UpdateFaceId.UpdateFaceIdCommand(command.UserId, true);
            // await _mediator.Send(updateFaceIdCommand, cancellationToken);

            return new UpdateFaceIdResponse
            {
                Success = true,
                Message = "Face ID updated successfully"
            };
        }
        catch (Exception ex)
        {
            return new UpdateFaceIdResponse
            {
                Success = false,
                Message = $"Error updating Face ID: {ex.Message}"
            };
        }
    }
}