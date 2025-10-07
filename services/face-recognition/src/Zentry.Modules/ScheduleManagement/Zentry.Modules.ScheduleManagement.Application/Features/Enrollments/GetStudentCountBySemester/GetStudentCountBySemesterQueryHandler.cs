using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetStudentCountBySemester;

public class GetStudentCountBySemesterQueryHandler(
    IEnrollmentRepository enrollmentRepository
) : IQueryHandler<GetStudentCountBySemesterQuery, GetStudentCountBySemesterResponse>
{
    public async Task<GetStudentCountBySemesterResponse> Handle(GetStudentCountBySemesterQuery request,
        CancellationToken cancellationToken)
    {
        var yearString = request.Year.ToString()[2..];

        var studentCountBySemester = await enrollmentRepository
            .CountStudentsByYearAsync(yearString, cancellationToken);

        return new GetStudentCountBySemesterResponse(studentCountBySemester);
    }
}