using Zentry.Modules.UserManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.GetUserRequests;

public class GetUserRequestsQuery : IQuery<GetUserRequestsResponse>
{
    public GetUserRequestsQuery()
    {
    }

    public GetUserRequestsQuery(int pageNumber, int pageSize, string? status = null, string? requestType = null)
    {
        PageNumber = pageNumber <= 0 ? 1 : pageNumber;
        PageSize = pageSize <= 0 ? 10 : pageSize;
        Status = status;
        RequestType = requestType;
    }

    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? Status { get; init; } // Thêm filter theo trạng thái
    public string? RequestType { get; init; } // Thêm filter theo loại request
}

public class GetUserRequestsResponse
{
    public IEnumerable<UserRequestDto> UserRequests { get; set; } = new List<UserRequestDto>();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}