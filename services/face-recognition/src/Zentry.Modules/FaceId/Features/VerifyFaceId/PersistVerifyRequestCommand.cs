using Zentry.Modules.FaceId.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.FaceId.Features.VerifyFaceId;

public record PersistVerifyRequestCommand(
    Guid RequestGroupId,
    Guid TargetUserId,
    Guid? InitiatorUserId,
    Guid? SessionId,
    Guid? ClassSectionId,
    float Threshold,
    DateTime ExpiresAt) : ICommand<bool>;

public class PersistVerifyRequestCommandHandler(IFaceIdRepository repository)
    : ICommandHandler<PersistVerifyRequestCommand, bool>
{
    public async Task<bool> Handle(PersistVerifyRequestCommand command, CancellationToken cancellationToken)
    {
        await repository.CreateVerifyRequestAsync(
            command.RequestGroupId,
            command.TargetUserId,
            command.InitiatorUserId,
            command.SessionId,
            command.ClassSectionId,
            command.Threshold,
            command.ExpiresAt,
            cancellationToken);
        return true;
    }
}

public record CompleteVerifyRequestCommand(
    Guid TargetUserId,
    Guid? SessionId,
    Guid RequestGroupId, // ← Đổi từ RequestId thành RequestGroupId
    bool Matched,
    float Similarity,
    bool completeIfFailed = false) : ICommand<bool>;

public class CompleteVerifyRequestCommandHandler(IFaceIdRepository repository)
    : ICommandHandler<CompleteVerifyRequestCommand, bool>
{
    public async Task<bool> Handle(CompleteVerifyRequestCommand command, CancellationToken cancellationToken)
    {
        // ✅ Sửa: Tìm kiếm bằng RequestGroupId và TargetUserId
        var request = await repository.GetVerifyRequestByGroupAndUserAsync(
            command.RequestGroupId,
            command.TargetUserId,
            cancellationToken);

        if (request is null) return false;

        if (command.Matched || command.completeIfFailed)
            await repository.CompleteVerifyRequestAsync(request, command.Matched, command.Similarity,
                cancellationToken);
        return true;
    }
}

// ✅ Thêm: Command để cập nhật NotificationId
public record UpdateNotificationIdCommand(
    Guid RequestGroupId,
    Guid TargetUserId,
    string NotificationId) : ICommand<bool>;

public class UpdateNotificationIdCommandHandler(IFaceIdRepository repository)
    : ICommandHandler<UpdateNotificationIdCommand, bool>
{
    public async Task<bool> Handle(UpdateNotificationIdCommand command, CancellationToken cancellationToken)
    {
        var request = await repository.GetVerifyRequestByGroupAndUserAsync(
            command.RequestGroupId,
            command.TargetUserId,
            cancellationToken);

        if (request is null) return false;

        // Cập nhật NotificationId
        request.UpdateNotificationId(command.NotificationId);
        await repository.UpdateVerifyRequestAsync(request, cancellationToken);

        return true;
    }
}