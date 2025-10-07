using Zentry.Modules.UserManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

// Đảm bảo using này có mặt

namespace Zentry.Modules.UserManagement.Features.GetUsers;

public class GetUsersQuery : IQuery<GetUsersResponse>
{
    // Thêm constructor không có tham số (parameterless constructor)
    public GetUsersQuery()
    {
        // Các giá trị mặc định cho PageNumber và PageSize đã được đặt ở thuộc tính init
        // Nên bạn không cần làm gì thêm ở đây, hoặc có thể thêm logic khởi tạo nếu cần
    }

    // Constructor hiện có của bạn (vẫn giữ lại nếu bạn cần tạo query với các giá trị cụ thể)
    public GetUsersQuery(int pageNumber, int pageSize, string? searchTerm = null, string? role = null,
        string? status = null)
    {
        // Bạn có thể giữ logic kiểm tra này ở đây hoặc chuyển vào validator
        PageNumber = pageNumber <= 0 ? 1 : pageNumber;
        PageSize = pageSize <= 0 ? 10 : pageSize;
        SearchTerm = searchTerm?.Trim();
        Role = role?.Trim();
        Status = status?.Trim();
    }

    public int PageNumber { get; init; } = 1; // Mặc định trang 1
    public int PageSize { get; init; } = 10; // Mặc định 10 người dùng mỗi trang

    public string? SearchTerm { get; init; }
    public string? Role { get; init; }
    public string? Status { get; init; }
}

public class GetUsersResponse
{
    public IEnumerable<UserListItemDto> Users { get; set; } = new List<UserListItemDto>();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}