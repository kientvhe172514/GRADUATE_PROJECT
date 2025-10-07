using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.UpdateFaceId;

public class UpdateFaceIdCommandHandler(IUserRepository userRepository)
    : ICommandHandler<UpdateFaceIdCommand, UpdateFaceIdResponse>
{
    public async Task<UpdateFaceIdResponse> Handle(UpdateFaceIdCommand command, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(command.UserId, cancellationToken);
        if (user == null)
            return new UpdateFaceIdResponse
            {
                Success = false,
                Message = "User not found."
            };

        user.UpdateFaceIdStatus(command.HasFaceId);
        await userRepository.UpdateAsync(user, cancellationToken);

        return new UpdateFaceIdResponse
        {
            Success = true,
            Message = command.HasFaceId ? "Face ID registered successfully." : "Face ID status updated.",
            LastUpdated = user.FaceIdLastUpdated
        };
    }
}