using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSectionById;

public class GetClassSectionByIdQueryHandler(IClassSectionRepository classSectionRepository, IMediator mediator)
    : IQueryHandler<GetClassSectionByIdQuery, ClassSectionDto>
{
    public async Task<ClassSectionDto> Handle(GetClassSectionByIdQuery query, CancellationToken cancellationToken)
    {
        var cs = await classSectionRepository.GetByIdAsync(query.Id, cancellationToken);
        if (cs is null || cs.IsDeleted)
            throw new ResourceNotFoundException("CLASS SECTION", query.Id);

        GetUserByIdAndRoleIntegrationResponse? lecturerInfo = null;
        if (cs.LecturerId.HasValue)
            try
            {
                lecturerInfo =
                    await mediator.Send(new GetUserByIdAndRoleIntegrationQuery(cs.LecturerId.Value, Role.Lecturer),
                        cancellationToken);
            }
            catch (NotFoundException)
            {
            }

        var studentIds = cs.Enrollments?.Select(e => e.StudentId).ToList() ?? new List<Guid>();

        var studentInfos = new Dictionary<Guid, BasicUserInfoDto>();
        if (studentIds.Count != 0)
        {
            var usersResponse = await mediator.Send(new GetUsersByIdsIntegrationQuery(studentIds), cancellationToken);
            studentInfos = usersResponse.Users.ToDictionary(u => u.Id);
        }

        var response = new ClassSectionDto
        {
            Id = cs.Id,
            CourseId = cs.CourseId,
            CourseCode = cs.Course?.Code,
            CourseName = cs.Course?.Name,
            LecturerId = cs.LecturerId,
            LecturerCode = lecturerInfo != null ? GetUserCode(lecturerInfo.Attributes) : null,
            LecturerFullName = lecturerInfo?.FullName ?? "Unassigned Lecturer",
            LecturerEmail = lecturerInfo?.Email,
            SectionCode = cs.SectionCode,
            Semester = cs.Semester,
            CreatedAt = cs.CreatedAt,
            UpdatedAt = cs.UpdatedAt,
            Schedules = cs.Schedules?
                .Select(s => new ScheduleDto
                {
                    Id = s.Id,
                    ClassSectionId = cs.Id,
                    ClassSectionCode = cs.SectionCode,
                    RoomId = s.RoomId,
                    RoomName = s.Room?.RoomName,
                    StartDate = s.StartDate,
                    EndDate = s.EndDate,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    WeekDay = s.WeekDay.ToString()
                })
                .ToList(),
            Enrollments = cs.Enrollments?
                .Select(e => new EnrollmentDto
                {
                    EnrollmentId = e.Id,
                    EnrollmentDate = e.EnrolledAt,
                    Status = e.Status.ToString(),
                    StudentId = e.StudentId,
                    StudentName = studentInfos.GetValueOrDefault(e.StudentId)?.FullName ?? "Unknown Student",

                    ClassSectionId = cs.Id,
                    ClassSectionCode = cs.SectionCode,
                    ClassSectionSemester = cs.Semester,

                    CourseId = cs.CourseId,
                    CourseCode = cs.Course?.Code,
                    CourseName = cs.Course?.Name,

                    LecturerId = cs.LecturerId,
                    LecturerName = lecturerInfo?.FullName ?? "Unassigned Lecturer"
                })
                .ToList()
        };

        return response;
    }

    private static string GetUserCode(Dictionary<string, string> attributes)
    {
        if (attributes.TryGetValue("EmployeeCode", out var employeeCode) &&
            !string.IsNullOrEmpty(employeeCode))
            return employeeCode;

        return string.Empty;
    }
}