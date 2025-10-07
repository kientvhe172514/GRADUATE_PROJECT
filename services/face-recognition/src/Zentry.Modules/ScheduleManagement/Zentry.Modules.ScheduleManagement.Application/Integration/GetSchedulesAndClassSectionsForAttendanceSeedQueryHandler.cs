using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Integration;

public class GetSchedulesAndClassSectionsForAttendanceSeedQueryHandler(
    IScheduleRepository scheduleRepository,
    IClassSectionRepository classSectionRepository,
    ILogger<GetSchedulesAndClassSectionsForAttendanceSeedQueryHandler> logger)
    : IQueryHandler<GetSchedulesAndClassSectionsForAttendanceSeedQuery,
        GetSchedulesAndClassSectionsForAttendanceSeedResponse>
{
    public async Task<GetSchedulesAndClassSectionsForAttendanceSeedResponse> Handle(
        GetSchedulesAndClassSectionsForAttendanceSeedQuery request, CancellationToken cancellationToken)
    {
        logger.LogInformation("Received GetSchedulesAndClassSectionsForAttendanceSeedQuery from another module.");

        try
        {
            var schedules = (await scheduleRepository.GetAllAsync(cancellationToken)).ToList();
            var classSections = (await classSectionRepository.GetAllAsync(cancellationToken)).ToList();

            var scheduleDtos = schedules.Select(s => new SeededScheduleDto
            {
                Id = s.Id,
                ClassSectionId = s.ClassSectionId,
                RoomId = s.RoomId,
                WeekDay = s.WeekDay.ToString(),
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                StartDate = s.StartDate,
                EndDate = s.EndDate
            }).ToList();

            var classSectionDtos = classSections.Select(cs => new SeededClassSectionDto
            {
                Id = cs.Id,
                CourseId = cs.CourseId,
                LecturerId = cs.LecturerId
            }).ToList();

            logger.LogInformation(
                $"Prepared {scheduleDtos.Count} Schedule DTOs and {classSectionDtos.Count} ClassSection DTOs for Attendance module.");

            return new GetSchedulesAndClassSectionsForAttendanceSeedResponse(scheduleDtos, classSectionDtos);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error occurred while preparing Schedule and ClassSection DTOs for seeding.");
            return new GetSchedulesAndClassSectionsForAttendanceSeedResponse([], []);
        }
    }
}