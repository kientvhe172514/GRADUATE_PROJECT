using MediatR;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ConfigurationManagement.Features.DeleteAttributeDefinition;

public class DeleteAttributeDefinitionCommand : ICommand<Unit>
{
    public Guid AttributeId { get; set; }
}