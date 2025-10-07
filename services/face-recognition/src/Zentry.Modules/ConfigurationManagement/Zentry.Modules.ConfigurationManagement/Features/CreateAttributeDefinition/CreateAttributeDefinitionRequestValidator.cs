using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Constants.Response;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateAttributeDefinition;

public class CreateAttributeDefinitionRequestValidator : BaseValidator<CreateAttributeDefinitionRequest>
{
    public CreateAttributeDefinitionRequestValidator()
    {
        RuleFor(x => x.Key)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.KeyRequired)
            .MaximumLength(100)
            .WithMessage("Key không được vượt quá 100 ký tự.");

        RuleFor(x => x.Key)
            .Matches("^[a-zA-Z0-9_]+$")
            .WithMessage("Key chỉ được chứa các ký tự chữ cái (a-z, A-Z), số (0-9) và dấu gạch dưới (_).");

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.DisplayNameRequired)
            .MaximumLength(255)
            .WithMessage("Tên hiển thị không được vượt quá 255 ký tự.");

        RuleFor(x => x.Description)
            .MaximumLength(1000)
            .WithMessage("Mô tả không được vượt quá 1000 ký tự.");

        RuleFor(x => x.DataType)
            .NotEmpty()
            .WithMessage(ErrorMessages.Settings.DataTypeRequired)
            .Must(BeAValidDataType)
            .WithMessage("Kiểu dữ liệu không hợp lệ. Vui lòng chọn từ các loại đã định nghĩa.");

        RuleFor(x => x.AllowedScopeTypes)
            .NotNull()
            .WithMessage("Allowed Scope Types không được để trống.")
            .Must(BeValidScopeTypes)
            .WithMessage("Có một hoặc nhiều Scope Type không hợp lệ trong danh sách cho phép.");

        RuleFor(x => x.Unit)
            .MaximumLength(50)
            .WithMessage("Đơn vị không được vượt quá 50 ký tự.");

        RuleFor(x => x.DefaultValue)
            .MaximumLength(1000)
            .WithMessage("Giá trị mặc định không được vượt quá 1000 ký tự.");

        When(x => x.DataType == DataType.Selection.ToString(), () =>
        {
            RuleFor(x => x.Options)
                .NotNull()
                .WithMessage("Các tùy chọn (Options) là bắt buộc đối với kiểu dữ liệu 'Selection'.")
                .Must(options => options != null && options.Any())
                .WithMessage("Cần ít nhất một tùy chọn (Option) đối với kiểu dữ liệu 'Selection'.");

            RuleForEach(x => x.Options).SetValidator(new OptionCreationDtoValidator());
        });
    }

    private bool BeAValidDataType(string dataType)
    {
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

    private bool BeValidScopeTypes(List<string> scopeTypes)
    {
        if (scopeTypes == null || !scopeTypes.Any()) return false;

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

public class OptionCreationDtoValidator : BaseValidator<OptionCreationDto>
{
    public OptionCreationDtoValidator()
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