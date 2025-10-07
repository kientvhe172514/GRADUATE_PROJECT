using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.User;

public record GetUsersByIdsIntegrationQuery(List<Guid> UserIds)
    : IQuery<GetUsersByIdsIntegrationResponse>;

public record GetUsersByIdsIntegrationResponse(List<BasicUserInfoDto> Users);

public class BasicUserInfoDto
{
    public Guid Id { get; set; }
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Code { get; set; }
    public Dictionary<string, string> Attributes { get; set; } = new();
}