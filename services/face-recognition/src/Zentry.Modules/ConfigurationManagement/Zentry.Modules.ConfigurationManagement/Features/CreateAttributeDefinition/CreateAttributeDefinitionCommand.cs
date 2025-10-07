using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.CreateAttributeDefinition;

public class CreateAttributeDefinitionCommand : ICommand<CreateAttributeDefinitionResponse>
{
    public CreateAttributeDefinitionRequest Details { get; set; } = new();
}