using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.DeleteFaceId;

public record DeleteFaceIdCommand(int UserId) : ICommand<DeleteFaceIdResponse>;
