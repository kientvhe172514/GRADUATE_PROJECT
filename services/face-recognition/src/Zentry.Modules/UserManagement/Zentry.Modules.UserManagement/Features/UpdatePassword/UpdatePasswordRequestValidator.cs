using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.UserManagement.Features.UpdatePassword;

public class UpdatePasswordRequestValidator : BaseValidator<UpdatePasswordRequest>
{
    public UpdatePasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("Mật khẩu là bắt buộc.")
            .MinimumLength(8)
            .WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .Matches("[A-Z]")
            .WithMessage("Mật khẩu phải chứa ít nhất một chữ cái in hoa.")
            .Matches("[a-z]")
            .WithMessage("Mật khẩu phải chứa ít nhất một chữ cái thường.")
            .Matches("[0-9]")
            .WithMessage("Mật khẩu phải chứa ít nhất một chữ số.")
            .Matches("[^a-zA-Z0-9]")
            .WithMessage("Mật khẩu phải chứa ít nhất một ký tự đặc biệt.");
    }
}