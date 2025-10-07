using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.GetClassSections;

public class GetClassSectionsQueryHandler(
    IClassSectionRepository classSectionRepository,
    IMediator mediator
) : IQueryHandler<GetClassSectionsQuery, GetClassSectionsResponse>
{
    public async Task<GetClassSectionsResponse> Handle(GetClassSectionsQuery query, CancellationToken cancellationToken)
    {
        var criteria = new ClassSectionListCriteria
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            SearchTerm = query.SearchTerm,
            CourseId = query.CourseId,
            LecturerId = query.LecturerId,
            StudentId = query.StudentId,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder
        };

        var (classSections, totalCount) =
            await classSectionRepository.GetPagedClassSectionsAsync(criteria, cancellationToken);

        if (totalCount == 0)
            return new GetClassSectionsResponse
            {
                Items = new List<ClassSectionListItemDto>(),
                TotalCount = 0,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };

        // Lấy danh sách LecturerId một cách an toàn và hiệu quả
        var lecturerIds = classSections
            .Where(cs => cs.LecturerId.HasValue)
            .Select(cs => cs.LecturerId!.Value)
            .Distinct()
            .ToList();

        // Tra cứu tất cả giảng viên cùng một lúc
        var lecturers = new Dictionary<Guid, BasicUserInfoDto>();
        if (lecturerIds.Any())
        {
            var lecturerLookupResponse =
                await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);
            lecturers = lecturerLookupResponse.Users.ToDictionary(u => u.Id, u => u);
        }

        var classSectionDtos = classSections.Select(cs =>
        {
            BasicUserInfoDto? lecturerInfo = null;
            if (cs.LecturerId.HasValue) lecturers.TryGetValue(cs.LecturerId.Value, out lecturerInfo);

            return new ClassSectionListItemDto
            {
                Id = cs.Id,
                SectionCode = cs.SectionCode,
                Semester = cs.Semester,
                CourseId = cs.CourseId,
                CourseCode = cs.Course?.Code,
                CourseName = cs.Course?.Name,
                LecturerId = cs.LecturerId,
                LecturerFullName = lecturerInfo?.FullName ?? "Unassigned Lecturer",
                NumberOfStudents = cs.Enrollments?.Count ?? 0
            };
        }).ToList();

        return new GetClassSectionsResponse
        {
            Items = classSectionDtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }
}