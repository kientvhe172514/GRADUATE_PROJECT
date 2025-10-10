using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetAllClassSectionsWithEnrollmentCount;

public class GetAllClassSectionsWithEnrollmentCountQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator
) : IQueryHandler<GetAllClassSectionsWithEnrollmentCountQuery, List<ClassSectionWithEnrollmentCountDto>>
{
    public async Task<List<ClassSectionWithEnrollmentCountDto>> Handle(
        GetAllClassSectionsWithEnrollmentCountQuery request,
        CancellationToken cancellationToken)
    {
        var activeClassSections = (await classSectionRepository.GetAllAsync(cancellationToken)).ToList();

        if (activeClassSections.Count == 0) return [];

        var lecturerIds = activeClassSections
            .Where(cs => cs.LecturerId.HasValue)
            .Select(cs => cs.LecturerId!.Value)
            .Distinct()
            .ToList();

        var lecturers = new Dictionary<Guid, BasicUserInfoDto>();
        if (lecturerIds.Count != 0)
        {
            var lecturerLookupResponse =
                await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);
            lecturers = lecturerLookupResponse.Users.ToDictionary(u => u.Id, u => u);
        }

        var result = activeClassSections.Select(cs =>
        {
            BasicUserInfoDto? lecturerInfo = null;
            if (cs.LecturerId.HasValue) lecturers.TryGetValue(cs.LecturerId.Value, out lecturerInfo);

            return new ClassSectionWithEnrollmentCountDto
            {
                Id = cs.Id,
                CourseId = cs.CourseId,
                CourseCode = cs.Course?.Code ?? "N/A",
                CourseName = cs.Course?.Name ?? "N/A",
                LecturerId = cs.LecturerId,
                LecturerName = lecturerInfo?.FullName ?? "Unassigned Lecturer",
                SectionCode = cs.SectionCode,
                Semester = cs.Semester,
                CreatedAt = cs.CreatedAt,
                UpdatedAt = cs.UpdatedAt,
                EnrolledStudentsCount =
                    cs.Enrollments?.Count(e => Equals(e.Status, EnrollmentStatus.Active)) ??
                    0
            };
        }).OrderBy(dto => dto.SectionCode).ToList();

        return result;
    }
}