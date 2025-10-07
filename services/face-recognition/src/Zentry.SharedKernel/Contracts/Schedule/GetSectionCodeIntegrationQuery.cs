using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetSectionCodeIntegrationQuery(Guid ClassSectionId) : IQuery<GetSectionCodeIntegrationResponse>;

public record GetSectionCodeIntegrationResponse(string SectionCode);