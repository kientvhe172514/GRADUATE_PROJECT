using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.GetEnrollments;

public class GetEnrollmentsQueryHandler(
    IEnrollmentRepository enrollmentRepository,
    ICourseRepository courseRepository,
    IMediator mediator
) : IQueryHandler<GetEnrollmentsQuery, GetEnrollmentsResponse>
{
    public async Task<GetEnrollmentsResponse> Handle(GetEnrollmentsQuery query, CancellationToken cancellationToken)
    {
        try
        {
            // 1. Kiểm tra CourseId nếu cần
            if (query.CourseId.HasValue && query.CourseId.Value != Guid.Empty)
            {
                var courseExists = await courseRepository.GetByIdAsync(query.CourseId.Value, cancellationToken);
                if (courseExists is null)
                    throw new NotFoundException("Course", query.CourseId.Value);
            }

            // 2. Tạo tiêu chí tìm kiếm
            var criteria = new EnrollmentListCriteria
            {
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                SearchTerm = query.SearchTerm,
                StudentId = query.StudentId,
                ClassSectionId = query.ClassSectionId,
                CourseId = query.CourseId,
                Status = query.Status,
                SortBy = query.SortBy,
                SortOrder = query.SortOrder
            };

            // 3. Lấy danh sách Enrollment
            var (enrollments, totalCount) =
                await enrollmentRepository.GetPagedEnrollmentsAsync(criteria, cancellationToken);

            if (totalCount == 0)
                return new GetEnrollmentsResponse
                {
                    Items = new List<EnrollmentDto>(),
                    TotalCount = 0,
                    PageNumber = query.PageNumber,
                    PageSize = query.PageSize
                };

            // 4. Thu thập các IDs cần tra cứu
            var studentIds = enrollments.Select(e => e.StudentId).Distinct().ToList();

            // Lấy LecturerIds một cách an toàn
            var lecturerIds = enrollments
                .Where(e => e.ClassSection?.LecturerId.HasValue == true)
                .Select(e => e.ClassSection!.LecturerId!.Value)
                .Distinct()
                .ToList();

            // Gộp IDs để tra cứu hiệu quả hơn, tránh trùng lặp
            var allUserIds = studentIds.Union(lecturerIds).ToList();

            // 5. Tra cứu tất cả người dùng cùng lúc bằng một query duy nhất
            var users = new Dictionary<Guid, BasicUserInfoDto>();
            if (allUserIds.Any())
            {
                var userLookupResponse =
                    await mediator.Send(new GetUsersByIdsIntegrationQuery(allUserIds), cancellationToken);
                users = userLookupResponse.Users.ToDictionary(u => u.Id, u => u);
            }

            // 6. Ánh xạ DTO
            var enrollmentItems = enrollments.Select(enrollment =>
            {
                users.TryGetValue(enrollment.StudentId, out var studentDto);

                BasicUserInfoDto? lecturerDto = null;
                if (enrollment.ClassSection?.LecturerId.HasValue == true)
                    users.TryGetValue(enrollment.ClassSection.LecturerId.Value, out lecturerDto);

                return new EnrollmentDto
                {
                    EnrollmentId = enrollment.Id,
                    EnrollmentDate = enrollment.EnrolledAt,
                    StudentId = enrollment.StudentId,
                    StudentName = studentDto?.FullName ?? "Unknown Student",
                    ClassSectionId = enrollment.ClassSectionId,
                    ClassSectionCode = enrollment.ClassSection?.SectionCode,
                    ClassSectionSemester = enrollment.ClassSection?.Semester,
                    CourseId = enrollment.ClassSection?.CourseId,
                    CourseCode = enrollment.ClassSection?.Course?.Code,
                    CourseName = enrollment.ClassSection?.Course?.Name ?? "Unknown Course",
                    LecturerId = enrollment.ClassSection?.LecturerId,
                    LecturerName = lecturerDto?.FullName ?? "Unassigned Lecturer", // Xử lý trường hợp null
                    Status = enrollment.Status.ToString()
                };
            }).ToList();

            return new GetEnrollmentsResponse
            {
                Items = enrollmentItems,
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };
        }
        catch (Exception e)
        {
            throw new InvalidOperationException(nameof(GetEnrollmentsQueryHandler), e);
        }
    }
}