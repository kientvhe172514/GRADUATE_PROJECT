using FluentValidation;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.Modules.UserManagement.Features.CreateUser;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        // Rule cho Email
        RuleFor(x => x.Email)
            .NotEmpty()
            .WithMessage("Email là bắt buộc.")
            .EmailAddress()
            .WithMessage("Email không hợp lệ.")
            .MaximumLength(255)
            .WithMessage("Email không được vượt quá 255 ký tự.");

        // Rule cho Password
        RuleFor(x => x.Password)
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

        // Rule cho FullName
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("Họ và tên là bắt buộc.")
            .MaximumLength(255)
            .WithMessage("Họ và tên không được vượt quá 255 ký tự.");

        // Rule cho PhoneNumber
        RuleFor(x => x.PhoneNumber)
            .Matches(@"^\d{10,11}$")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber))
            .WithMessage("Số điện thoại không hợp lệ. Phải là 10 hoặc 11 chữ số.");

        // Rule cho Role
        RuleFor(x => x.Role)
            .Must(BeAValidRole)
            .WithMessage("Vai trò không hợp lệ.");
    }

    private bool BeAValidRole(string role)
    {
        try
        {
            Role.FromName(role);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}