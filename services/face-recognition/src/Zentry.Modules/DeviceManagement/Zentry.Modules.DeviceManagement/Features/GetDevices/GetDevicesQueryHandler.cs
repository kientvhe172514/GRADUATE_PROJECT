using MediatR;
using Zentry.Modules.DeviceManagement.Abstractions;
using Zentry.Modules.DeviceManagement.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Device;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.DeviceManagement.Features.GetDevices;

public class GetDevicesQueryHandler(
    IDeviceRepository deviceRepository,
    IMediator mediator
) : IQueryHandler<GetDevicesQuery, GetDevicesResponse>
{
    public async Task<GetDevicesResponse> Handle(GetDevicesQuery query, CancellationToken cancellationToken)
    {
        DeviceStatus? statusEnum = null;
        if (!string.IsNullOrWhiteSpace(query.Status)) statusEnum = DeviceStatus.FromName(query.Status);

        var (devices, totalCount) = await deviceRepository.GetDevicesAsync(
            query.PageNumber,
            query.PageSize,
            query.SearchTerm,
            query.UserId,
            statusEnum,
            cancellationToken
        );

        var deviceListItemDtos = devices.ToList();
        if (deviceListItemDtos.Count == 0)
            return new GetDevicesResponse
            {
                Devices = new List<DeviceListItemDto>(),
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalCount = totalCount
            };

        // Bước 2: Thu thập tất cả UserId duy nhất từ danh sách thiết bị
        var userIds = deviceListItemDtos.Select(d => d.UserId).Distinct().ToList();

        // Bước 3: Gửi GetUsersByIdsIntegrationQuery để lấy thông tin chi tiết của các user
        var usersResponse = await mediator.Send(new GetUsersByIdsIntegrationQuery(userIds), cancellationToken);
        var userDict = usersResponse.Users.ToDictionary(u => u.Id, u => u);

        // Bước 4: Ánh xạ thông tin người dùng vào DeviceListItemDto
        var devicesWithUserInfo = deviceListItemDtos.Select(deviceDto =>
        {
            var user = userDict.GetValueOrDefault(deviceDto.UserId);
            deviceDto.UserFullName = user?.FullName;
            deviceDto.UserEmail = user?.Email;
            return deviceDto;
        }).ToList();

        return new GetDevicesResponse
        {
            Devices = devicesWithUserInfo,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }
}