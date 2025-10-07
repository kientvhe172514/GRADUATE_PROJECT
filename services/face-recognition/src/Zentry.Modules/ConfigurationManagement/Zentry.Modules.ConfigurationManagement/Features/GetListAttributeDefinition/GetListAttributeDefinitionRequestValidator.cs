using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Features.GetListAttributeDefinition;

public class GetListAttributeDefinitionQueryValidator : BaseValidator<GetListAttributeDefinitionQuery>
{
    public GetListAttributeDefinitionQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageNumber phải lớn hơn hoặc bằng 1.");

        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(1)
            .WithMessage("PageSize phải lớn hơn hoặc bằng 1.")
            .LessThanOrEqualTo(100) // Ví dụ: giới hạn số lượng mục trên mỗi trang
            .WithMessage("PageSize không được vượt quá 100.");

        RuleFor(x => x.Key)
            .MaximumLength(100)
            .WithMessage("Key tìm kiếm không được vượt quá 100 ký tự.");

        RuleFor(x => x.DisplayName)
            .MaximumLength(255)
            .WithMessage("Tên hiển thị tìm kiếm không được vượt quá 255 ký tự.");

        When(x => !string.IsNullOrWhiteSpace(x.DataType), () =>
        {
            RuleFor(x => x.DataType)
                .Must(BeAValidDataType)
                .WithMessage("Kiểu dữ liệu tìm kiếm không hợp lệ.");
        });

        When(x => !string.IsNullOrWhiteSpace(x.ScopeType), () =>
        {
            RuleFor(x => x.ScopeType)
                .Must(BeAValidScopeType)
                .WithMessage("Kiểu phạm vi tìm kiếm không hợp lệ.");
        });

        // Validation cho OrderBy: Đảm bảo chỉ chấp nhận các cột và hướng sắp xếp hợp lệ
        When(x => !string.IsNullOrWhiteSpace(x.OrderBy), () =>
        {
            RuleFor(x => x.OrderBy)
                .Must(BeAValidOrderByClause)
                .WithMessage("OrderBy không hợp lệ. Vui lòng sử dụng định dạng 'propertyName asc/desc'.");
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

    private bool BeAValidOrderByClause(string? orderBy)
    {
        if (string.IsNullOrWhiteSpace(orderBy)) return true;

        var parts = orderBy.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length < 1 || parts.Length > 2) return false;

        var propertyName = parts[0].ToLower();
        var validProperties = new List<string> { "key", "displayname", "datatype", "createdat", "updatedat" };

        if (!validProperties.Contains(propertyName)) return false;

        if (parts.Length == 2)
        {
            var direction = parts[1].ToLower();
            if (direction != "asc" && direction != "desc") return false;
        }

        return true;
    }
}