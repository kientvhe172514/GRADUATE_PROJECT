using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.DeviceManagement.Features.GetTotalDevices;

public record GetTotalDevicesQuery : IQuery<GetTotalDevicesResponse>;

public record GetTotalDevicesResponse(int ActiveDevices, int TotalDevices);