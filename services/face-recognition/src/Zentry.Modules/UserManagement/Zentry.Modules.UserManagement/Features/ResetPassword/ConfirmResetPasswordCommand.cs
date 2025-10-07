using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.ResetPassword;

public record ConfirmResetPasswordCommand(string Email, string Token, string NewPassword) : ICommand<Unit>;