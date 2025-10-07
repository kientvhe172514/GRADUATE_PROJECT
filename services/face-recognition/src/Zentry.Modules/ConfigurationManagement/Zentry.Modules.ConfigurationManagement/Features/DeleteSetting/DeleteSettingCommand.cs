using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.DeleteSetting;

public class DeleteSettingCommand : ICommand<Unit>
{
    public Guid SettingId { get; set; }
}