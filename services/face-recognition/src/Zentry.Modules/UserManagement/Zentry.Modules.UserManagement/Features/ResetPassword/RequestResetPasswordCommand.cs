using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.ResetPassword;

public record RequestResetPasswordCommand(string Email) : ICommand<Unit>;