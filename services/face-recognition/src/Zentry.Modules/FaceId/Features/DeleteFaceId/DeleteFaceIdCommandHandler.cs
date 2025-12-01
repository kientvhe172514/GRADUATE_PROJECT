using MediatR;
using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.DeleteFaceId;

public class DeleteFaceIdCommandHandler : ICommandHandler<DeleteFaceIdCommand, DeleteFaceIdResponse>
{
    private readonly IFaceIdRepository _faceIdRepository;
    private readonly IMediator _mediator;

    public DeleteFaceIdCommandHandler(IFaceIdRepository faceIdRepository, IMediator mediator)
    {
        _faceIdRepository = faceIdRepository;
        _mediator = mediator;
    }

    public async Task<DeleteFaceIdResponse> Handle(DeleteFaceIdCommand command, CancellationToken cancellationToken)
    {
        try
        {
            // Check if user has a face ID
            var faceEmbedding = await _faceIdRepository.GetByUserIdAsync(command.UserId, cancellationToken);
            
            if (faceEmbedding == null)
            {
                return new DeleteFaceIdResponse
                {
                    Success = false,
                    Message = "User does not have a registered Face ID."
                };
            }

            // Delete the face embedding
            await _faceIdRepository.DeleteAsync(faceEmbedding, cancellationToken);

            // ✅ Note: Service này chỉ xóa face embedding
            // Client có thể register lại sau này
            // TODO: Nếu cần, có thể gọi API sang service auth/employee để update face status qua HTTP/RabbitMQ

            return new DeleteFaceIdResponse
            {
                Success = true,
                Message = "Face ID deleted successfully. User can now register a new Face ID."
            };
        }
        catch (Exception ex)
        {
            return new DeleteFaceIdResponse
            {
                Success = false,
                Message = $"Error deleting Face ID: {ex.Message}"
            };
        }
    }
}
