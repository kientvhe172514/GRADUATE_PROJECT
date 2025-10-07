using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.Modules.UserManagement.Features.UpdateUser;

public class UpdateUserRequestValidator : BaseValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
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

    private bool BeAValidRole(string? role)
    {
        try
        {
            if (role != null) Role.FromName(role);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}