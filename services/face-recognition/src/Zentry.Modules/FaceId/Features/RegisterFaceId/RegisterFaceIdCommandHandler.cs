using MediatR;
using Zentry.Modules.FaceId.Interfaces;
// ❌ COMMENT: UserManagement đã có service riêng xử lý
// using Zentry.Modules.UserManagement.Features.UpdateFaceId;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.RegisterFaceId;

public class RegisterFaceIdCommandHandler : ICommandHandler<RegisterFaceIdCommand, RegisterFaceIdResponse>
{
    private readonly IFaceIdRepository _faceIdRepository;
    private readonly IMediator _mediator;

    public RegisterFaceIdCommandHandler(IFaceIdRepository faceIdRepository, IMediator mediator)
    {
        _faceIdRepository = faceIdRepository;
        _mediator = mediator;
    }

    public async Task<RegisterFaceIdResponse> Handle(RegisterFaceIdCommand command, CancellationToken cancellationToken)
    {
        try
        {
            // Check if user already has a face ID
            var exists = await _faceIdRepository.ExistsByUserIdAsync(command.UserId, cancellationToken);
            if (exists)
                return new RegisterFaceIdResponse
                {
                    Success = false,
                    Message = "User already has a registered Face ID. Use update instead."
                };

            // Save embedding to database (now accepts float[] directly)
            await _faceIdRepository.CreateAsync(command.UserId, command.EmbeddingArray, cancellationToken);

            // ❌ COMMENT: Update user's face ID status - Service auth/employee riêng xử lý
            // TODO: Gọi API sang service auth/employee để update face status qua HTTP/RabbitMQ
            // var updateFaceIdCommand = new UpdateFaceIdCommand(command.UserId, true);
            // await _mediator.Send(updateFaceIdCommand, cancellationToken);

            return new RegisterFaceIdResponse
            {
                Success = true,
                Message = "Face ID registered successfully"
            };
        }
        catch (Exception ex)
        {
            return new RegisterFaceIdResponse
            {
                Success = false,
                Message = $"Error registering Face ID: {ex.Message}"
            };
        }
    }
}