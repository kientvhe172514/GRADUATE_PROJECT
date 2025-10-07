using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateSetting;

public class CreateSettingRequestValidator : BaseValidator<CreateSettingRequest>
{
    public CreateSettingRequestValidator()
    {
        RuleFor(x => x.AttributeKey)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.KeyRequired)
            .MaximumLength(100)
            .WithMessage("Attribute Key không được vượt quá 100 ký tự.");

        RuleFor(x => x.ScopeType)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.SettingScopeTypeRequired)
            .Must(BeAValidScopeType)
            .WithMessage("Kiểu phạm vi (ScopeType) không hợp lệ. Vui lòng chọn từ các loại đã định nghĩa.");

        RuleFor(x => x.ScopeId)
            .Custom((scopeIdString, context) =>
            {
                var request = context.InstanceToValidate;
                var scopeType = ScopeType.FromName(request.ScopeType);

                if (Equals(scopeType, ScopeType.Global))
                {
                    if (string.IsNullOrWhiteSpace(scopeIdString)) return;

                    if (!Guid.TryParse(scopeIdString, out var parsedGuid) || parsedGuid != Guid.Empty)
                        context.AddFailure(nameof(request.ScopeId),
                            "Đối với Global ScopeType, ScopeId phải là GUID rỗng (ví dụ: '00000000-0000-0000-0000-000000000000') hoặc để trống.");
                }
                else
                {
                    if (string.IsNullOrWhiteSpace(scopeIdString))
                    {
                        context.AddFailure(nameof(request.ScopeId), ErrorMessages.Settings.ScopeIdRequired);
                        return;
                    }

                    if (!Guid.TryParse(scopeIdString, out var parsedGuid) || parsedGuid == Guid.Empty)
                        context.AddFailure(nameof(request.ScopeId),
                            ErrorMessages.GuidFormatInvalid + " (hoặc không được là GUID rỗng).");
                }
            });

        RuleFor(x => x.Value)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.ValueRequired)
            .MaximumLength(500)
            .WithMessage("Giá trị không được vượt quá 500 ký tự.");
    }

    private bool BeAValidScopeType(string scopeType)
    {
        try
        {
            ScopeType.FromName(scopeType);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}