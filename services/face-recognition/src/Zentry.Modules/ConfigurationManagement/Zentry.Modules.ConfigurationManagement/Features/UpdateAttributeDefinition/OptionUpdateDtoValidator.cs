using FluentValidation;
using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;

public class OptionUpdateDtoValidator : BaseValidator<OptionUpdateDto>
{
    public OptionUpdateDtoValidator()
    {
        RuleFor(x => x.Value)
            .NotEmpty()
            .WithMessage("Giá trị của tùy chọn không được để trống.")
            .MaximumLength(255)
            .WithMessage("Giá trị của tùy chọn không được vượt quá 255 ký tự.");

        RuleFor(x => x.DisplayLabel)
            .NotEmpty()
            .WithMessage("Nhãn hiển thị của tùy chọn không được để trống.")
            .MaximumLength(255)
            .WithMessage("Nhãn hiển thị của tùy chọn không được vượt quá 255 ký tự.");

        RuleFor(x => x.SortOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Thứ tự sắp xếp phải là một số không âm.");
    }
}