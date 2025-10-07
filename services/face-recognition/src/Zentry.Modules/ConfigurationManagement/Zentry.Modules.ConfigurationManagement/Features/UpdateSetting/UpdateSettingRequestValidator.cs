using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Response;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateSetting;

public class UpdateSettingRequestValidator : BaseValidator<UpdateSettingRequest>
{
    public UpdateSettingRequestValidator()
    {
        RuleFor(x => x.Value)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.ValueRequired)
            .MaximumLength(500)
            .WithMessage("Giá trị không được vượt quá 500 ký tự.");
    }
}