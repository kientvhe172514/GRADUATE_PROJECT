using Zentry.Modules.ConfigurationManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.GetListAttributeDefinition;

public class GetListAttributeDefinitionQuery : IQuery<GetListAttributeDefinitionResponse>
{
    public GetListAttributeDefinitionQuery()
    {
    }

    public GetListAttributeDefinitionQuery(
        int pageNumber,
        int pageSize,
        string? key = null,
        string? displayName = null,
        string? dataType = null,
        string? scopeType = null,
        string? orderBy = null)
    {
        PageNumber = pageNumber <= 0 ? 1 : pageNumber;
        PageSize = pageSize <= 0 ? 10 : pageSize;
        Key = key?.Trim();
        DisplayName = displayName?.Trim();
        DataType = dataType?.Trim();
        ScopeType = scopeType?.Trim();
        OrderBy = orderBy?.Trim();
    }

    // Thuộc tính phân trang
    public int PageNumber { get; init; } = 1; // Mặc định trang 1
    public int PageSize { get; init; } = 10; // Mặc định 10 mục mỗi trang

    // Các trường tìm kiếm/lọc
    public string? Key { get; init; } // Tìm kiếm theo Key
    public string? DisplayName { get; init; } // Tìm kiếm theo DisplayName
    public string? DataType { get; init; } // Lọc theo DataType
    public string? ScopeType { get; init; } // Lọc theo ScopeType có trong AllowedScopeTypes

    // Trường sắp xếp
    public string? OrderBy { get; init; } // Ví dụ: "Key asc", "CreatedAt desc"
}

public class GetListAttributeDefinitionResponse
{
    public IEnumerable<AttributeDefinitionListItemDto> AttributeDefinitions { get; set; } =
        new List<AttributeDefinitionListItemDto>();

    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}

public class AttributeDefinitionListItemDto
{
    public Guid AttributeId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string DataType { get; set; }
    public List<string> AllowedScopeTypes { get; set; } = new();
    public string? Unit { get; set; }
    public string? DefaultValue { get; set; }
    public bool IsDeletable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<OptionDto>? Options { get; set; } // Nếu DataType là Selection
}