using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Features.UpdateAttributeDefinition;

public class UpdateAttributeDefinitionRequestValidator : BaseValidator<UpdateAttributeDefinitionRequest>
{
    public UpdateAttributeDefinitionRequestValidator()
    {
        RuleFor(x => x.DisplayName)
            .MaximumLength(255)
            .WithMessage("Tên hiển thị không được vượt quá 255 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.DisplayName));

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Mô tả không được vượt quá 1000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Description));

        RuleFor(x => x.DataType)
            .Must(BeAValidDataType)
            .WithMessage("Kiểu dữ liệu không hợp lệ. Vui lòng chọn từ các loại đã định nghĩa.")
            .When(x => !string.IsNullOrWhiteSpace(x.DataType));

        RuleFor(x => x.AllowedScopeTypes)
            .Must(BeValidScopeTypes)
            .WithMessage("Có một hoặc nhiều Scope Type không hợp lệ trong danh sách cho phép.")
            .When(x => x.AllowedScopeTypes != null && x.AllowedScopeTypes.Any());

        RuleFor(x => x.Unit)
            .MaximumLength(50)
            .WithMessage("Đơn vị không được vượt quá 50 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Unit));

        RuleFor(x => x.DefaultValue)
            .MaximumLength(1000)
            .WithMessage("Giá trị mặc định không được vượt quá 1000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.DefaultValue));

        // Validation cho Selection DataType
        When(x => !string.IsNullOrWhiteSpace(x.DataType) && x.DataType == DataType.Selection.ToString(), () =>
        {
            RuleFor(x => x.Options)
                .NotNull()
                .WithMessage("Các tùy chọn (Options) là bắt buộc đối với kiểu dữ liệu 'Selection'.")
                .Must(options => options != null && options.Any())
                .WithMessage("Cần ít nhất một tùy chọn (Option) đối với kiểu dữ liệu 'Selection'.");

            RuleForEach(x => x.Options).SetValidator(new OptionUpdateDtoValidator());
        });
    }

    private bool BeAValidDataType(string? dataType)
    {
        if (string.IsNullOrWhiteSpace(dataType)) return true;

        try
        {
            DataType.FromName(dataType);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }

    private bool BeValidScopeTypes(List<string>? scopeTypes)
    {
        if (scopeTypes == null || !scopeTypes.Any()) return true;

        foreach (var scopeTypeName in scopeTypes)
            try
            {
                ScopeType.FromName(scopeTypeName);
            }
            catch (InvalidOperationException)
            {
                return false;
            }

        return true;
    }
}