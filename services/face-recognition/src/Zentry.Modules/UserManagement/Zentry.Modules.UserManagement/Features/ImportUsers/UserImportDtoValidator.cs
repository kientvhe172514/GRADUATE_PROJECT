using System.Text.RegularExpressions;
using FluentValidation;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.UserManagement.Features.ImportUsers;

public class UserImportDtoValidator : BaseValidator<UserImportDto>
{
    public UserImportDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Tên đầy đủ không được để trống.")
            .MaximumLength(255).WithMessage("Tên đầy đủ không được vượt quá 255 ký tự.");

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Số điện thoại không được vượt quá 20 ký tự.")
            .Matches(new Regex(@"^\+?[0-9\s-]{7,15}$")).WithMessage("Số điện thoại không đúng định dạng.")
            .When(x => !string.IsNullOrEmpty(x.PhoneNumber));

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("Vai trò không được để trống.")
            .Must(role =>
                Enumeration.GetAll<Role>().Any(r => r.ToString().Equals(role, StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Vai trò không hợp lệ.");
    }
}