using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record GetEnrollmentsByClassSectionIdIntegrationQuery(Guid ClassSectionId)
    : IQuery<GetEnrollmentsByClassSectionIdIntegrationResponse>;

public record GetEnrollmentsByClassSectionIdIntegrationResponse(List<BasicEnrollmentDto> Enrollments);

public class BasicEnrollmentDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public DateTime EnrolledAt { get; set; }
    public string? Status { get; set; }
}