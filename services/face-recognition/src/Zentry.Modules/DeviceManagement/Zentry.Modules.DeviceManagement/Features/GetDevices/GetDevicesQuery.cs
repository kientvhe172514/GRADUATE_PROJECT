using Zentry.Modules.DeviceManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.GetDevices;

public class GetDevicesQuery : IQuery<GetDevicesResponse>
{
    public GetDevicesQuery()
    {
    }

    public GetDevicesQuery(int? pageNumber, int? pageSize, string? searchTerm = null, Guid? userId = null,
        string? status = null)
    {
        PageNumber = pageNumber <= 0 ? 10 : pageNumber ?? 1;
        PageSize = pageSize <= 0 ? 10 : pageSize ?? 1;
        SearchTerm = searchTerm?.Trim();
        UserId = userId;
        Status = status?.Trim();
    }

    public int PageNumber { get; init; } = 1;
    public int PageSize { get; init; } = 10;

    public string? SearchTerm { get; init; }
    public Guid? UserId { get; init; }
    public string? Status { get; init; }
}

public class GetDevicesResponse
{
    public IEnumerable<DeviceListItemDto> Devices { get; set; } = new List<DeviceListItemDto>();
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => PageNumber < TotalPages;
    public bool HasPreviousPage => PageNumber > 1;
}