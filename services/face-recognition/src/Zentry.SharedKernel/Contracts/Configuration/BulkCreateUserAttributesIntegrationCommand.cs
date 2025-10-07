using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public record BulkCreateUserAttributesIntegrationCommand(
    Dictionary<Guid, Dictionary<string, string>> UserAttributesMap
) : ICommand<BulkCreateUserAttributesIntegrationResponse>;

public record BulkCreateUserAttributesIntegrationResponse(
    bool Success,
    string Message,
    Dictionary<Guid, List<string>> SkippedAttributesByUser,
    int TotalProcessed,
    int TotalSuccessful,
    int TotalFailed
);
