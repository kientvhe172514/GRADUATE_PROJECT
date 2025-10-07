using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.GetSchedules;

public class GetSchedulesQueryHandler(
    IScheduleRepository scheduleRepository,
    IMediator mediator
) : IQueryHandler<GetSchedulesQuery, GetSchedulesResponse>
{
    public async Task<GetSchedulesResponse> Handle(GetSchedulesQuery query, CancellationToken cancellationToken)
    {
        var criteria = new ScheduleListCriteria
        {
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            LecturerId = query.LecturerId,
            ClassSectionId = query.ClassSectionId,
            RoomId = query.RoomId,
            WeekDay = query.WeekDay,
            SortBy = query.SortBy,
            SortOrder = query.SortOrder,
            SearchTerm = query.SearchTerm
        };

        var (schedules, totalCount) =
            await scheduleRepository.GetPagedSchedulesWithIncludesAsync(criteria, cancellationToken);

        // Cải thiện logic lấy lecturerIds
        var lecturerIds = schedules
            .Where(s => s.ClassSection?.LecturerId.HasValue == true) // Kiểm tra HasValue để an toàn hơn
            .Select(s => s.ClassSection!.LecturerId!.Value) // Lấy giá trị của Guid
            .Distinct()
            .ToList();

        // Xử lý trường hợp không có giảng viên nào để tra cứu
        var lecturers = new Dictionary<Guid, BasicUserInfoDto>();
        if (lecturerIds.Any())
            try
            {
                var lecturerLookupResponse =
                    await mediator.Send(new GetUsersByIdsIntegrationQuery(lecturerIds), cancellationToken);

                lecturers = lecturerLookupResponse.Users
                    .ToDictionary(u => u.Id, u => u);
            }
            catch (Exception ex)
            {
            }

        var scheduleDtos = schedules.Select(s =>
        {
            // Lấy LecturerId từ ClassSection
            var lecturerId = s.ClassSection?.LecturerId;
            BasicUserInfoDto? lecturerInfo = null;
            if (lecturerId.HasValue) lecturers.TryGetValue(lecturerId.Value, out lecturerInfo);

            return new ScheduleDto
            {
                Id = s.Id,
                ClassSectionId = s.ClassSectionId,
                ClassSectionCode = s.ClassSection?.SectionCode,

                // Gán LecturerId và Name
                LecturerId = lecturerId,
                LecturerName = lecturerInfo?.FullName ?? "Unknown Lecturer",

                CourseId = s.ClassSection?.CourseId, // Dùng Guid? để an toàn hơn
                CourseCode = s.ClassSection?.Course?.Code,
                CourseName = s.ClassSection?.Course?.Name ?? "Unknown Course",
                RoomId = s.RoomId,
                RoomName = s.Room?.RoomName ?? "Unknown Room",
                StartDate = s.StartDate,
                EndDate = s.EndDate,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                WeekDay = s.WeekDay.ToString(),
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            };
        }).ToList();

        return new GetSchedulesResponse
        {
            Schedules = scheduleDtos,
            TotalCount = totalCount,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize
        };
    }
}