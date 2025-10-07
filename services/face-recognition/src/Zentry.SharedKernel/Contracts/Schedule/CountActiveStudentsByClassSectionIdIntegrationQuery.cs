using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Schedule;

public record CountActiveStudentsByClassSectionIdIntegrationQuery(Guid ClassSectionId)
    : IQuery<CountActiveStudentsByClassSectionIdIntegrationResponse>;

public record CountActiveStudentsByClassSectionIdIntegrationResponse(int TotalStudents);