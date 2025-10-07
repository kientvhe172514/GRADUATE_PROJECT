using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Contracts.Events;
using Zentry.SharedKernel.Contracts.Schedule;

namespace Zentry.Modules.AttendanceManagement.Application.EventHandlers;

public class AttendanceRecordCreatorConsumer(
    ILogger<AttendanceRecordCreatorConsumer> logger,
    IAttendanceRecordRepository attendanceRecordRepository,
    ISessionRepository sessionRepository,
    IMediator mediator)
    : IConsumer<SessionCreatedMessage>, IConsumer<StudentEnrolledMessage>
{
    public async Task Consume(ConsumeContext<SessionCreatedMessage> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "Received SessionCreatedMessage for SessionId: {SessionId}, ScheduleId: {ScheduleId}",
            message.SessionId, message.ScheduleId);

        try
        {
            // Verify session exists
            var session = await sessionRepository.GetByIdAsync(message.SessionId, context.CancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found. Skipping attendance record creation.",
                    message.SessionId);
                return;
            }

            // Get ClassSection information from ScheduleId
            var classSectionResponse = await mediator.Send(
                new GetClassSectionByScheduleIdIntegrationQuery(message.ScheduleId),
                context.CancellationToken);

            if (classSectionResponse.ClassSectionId == Guid.Empty)
            {
                logger.LogWarning(
                    "No ClassSection found for ScheduleId {ScheduleId}. Cannot create attendance records for SessionId {SessionId}",
                    message.ScheduleId, message.SessionId);
                return;
            }

            // Get all enrolled students for this class section
            var studentIdsResponse = await mediator.Send(
                new GetStudentIdsByClassSectionIdIntegrationQuery(classSectionResponse.ClassSectionId),
                context.CancellationToken);

            if (studentIdsResponse.StudentIds.Count == 0)
            {
                logger.LogInformation(
                    "No enrolled students found for ClassSectionId {ClassSectionId}, SessionId {SessionId}. No attendance records to create.",
                    classSectionResponse.ClassSectionId, message.SessionId);
                return;
            }

            await CreateAttendanceRecordsForSession(message.SessionId, studentIdsResponse.StudentIds,
                context.CancellationToken);

            logger.LogInformation(
                "Successfully processed SessionCreatedMessage for SessionId {SessionId}",
                message.SessionId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing SessionCreatedMessage for SessionId {SessionId}, ScheduleId {ScheduleId}",
                message.SessionId, message.ScheduleId);
            throw;
        }
    }

    public async Task Consume(ConsumeContext<StudentEnrolledMessage> context)
    {
        var message = context.Message;
        logger.LogInformation(
            "Received StudentEnrolledMessage for ClassSectionId: {ClassSectionId}",
            message.ClassSectionId);

        try
        {
            // Determine which students need attendance records
            var studentIds = new List<Guid>();

            // Handle bulk enrollment case (multiple students)
            if (message.EnrolledStudentIds != null && message.EnrolledStudentIds.Any())
            {
                studentIds.AddRange(message.EnrolledStudentIds);
                logger.LogInformation(
                    "Processing bulk enrollment for {Count} students in ClassSectionId {ClassSectionId}. Students: [{StudentIds}]",
                    message.EnrolledStudentIds.Count,
                    message.ClassSectionId,
                    string.Join(", ", message.EnrolledStudentIds));
            }

            // Handle single student enrollment case
            if (message.StudentId != Guid.Empty)
            {
                // Avoid duplicate if student is also in bulk list
                if (!studentIds.Contains(message.StudentId)) studentIds.Add(message.StudentId);

                logger.LogInformation(
                    "Processing single student enrollment for StudentId {StudentId} in ClassSectionId {ClassSectionId}",
                    message.StudentId, message.ClassSectionId);
            }

            // Validate we have students to process
            if (studentIds.Count == 0)
            {
                logger.LogWarning(
                    "No valid student IDs found in StudentEnrolledMessage for ClassSectionId {ClassSectionId}. " +
                    "StudentId: {StudentId}, EnrolledStudentIds count: {EnrolledCount}",
                    message.ClassSectionId, message.StudentId,
                    message.EnrolledStudentIds?.Count ?? 0);
                return;
            }

            logger.LogInformation(
                "Total students to process attendance records: {Count} for ClassSectionId {ClassSectionId}",
                studentIds.Count, message.ClassSectionId);

            // Get all schedules for this class section
            var schedulesResponse = await mediator.Send(
                new GetSchedulesByClassSectionIdIntegrationQuery(message.ClassSectionId),
                context.CancellationToken);

            if (schedulesResponse.Schedules.Count == 0)
            {
                logger.LogInformation(
                    "No schedules found for ClassSectionId {ClassSectionId}. No attendance records to create.",
                    message.ClassSectionId);
                return;
            }

            // Get all sessions for these schedules
            var scheduleIds = schedulesResponse.Schedules.Select(s => s.ScheduleId).ToList();
            var sessionsResponse = await mediator.Send(
                new GetSessionsByScheduleIdsIntegrationQuery(scheduleIds),
                context.CancellationToken);

            if (sessionsResponse.Data.Count == 0)
            {
                logger.LogInformation(
                    "No sessions found for ClassSectionId {ClassSectionId}. No attendance records to create.",
                    message.ClassSectionId);
                return;
            }

            // Create attendance records for each student and each session
            var attendanceRecordsCreated = 0;
            var sessionsProcessed = 0;

            // For single student enrollment, we can process more efficiently
            if (studentIds.Count == 1)
            {
                var singleStudentId = studentIds[0];
                logger.LogInformation(
                    "Processing single student {StudentId} for {SessionCount} sessions",
                    singleStudentId, sessionsResponse.Data.Count);

                foreach (var sessionDetail in sessionsResponse.Data)
                {
                    var recordsCreated = await CreateAttendanceRecordsForSession(
                        sessionDetail.SessionId,
                        [singleStudentId],
                        context.CancellationToken);

                    if (recordsCreated > 0)
                    {
                        attendanceRecordsCreated += recordsCreated;
                        sessionsProcessed++;

                        logger.LogDebug(
                            "Created attendance record for Student {StudentId} in Session {SessionId} (Session #{SessionNumber})",
                            singleStudentId, sessionDetail.SessionId, sessionDetail.SessionNumber);
                    }
                }

                logger.LogInformation(
                    "Single student processing complete: Created {RecordCount} attendance records for Student {StudentId} " +
                    "across {SessionCount} sessions in ClassSection {ClassSectionId}",
                    attendanceRecordsCreated, singleStudentId, sessionsProcessed, message.ClassSectionId);
            }
            else
            {
                // Bulk processing for multiple students
                logger.LogInformation(
                    "Processing {StudentCount} students for {SessionCount} sessions",
                    studentIds.Count, sessionsResponse.Data.Count);

                foreach (var sessionDetail in sessionsResponse.Data)
                {
                    var recordsCreated = await CreateAttendanceRecordsForSession(
                        sessionDetail.SessionId,
                        studentIds,
                        context.CancellationToken);

                    if (recordsCreated > 0)
                    {
                        attendanceRecordsCreated += recordsCreated;
                        sessionsProcessed++;

                        logger.LogDebug(
                            "Created {RecordCount} attendance records for Session {SessionId} (Session #{SessionNumber})",
                            recordsCreated, sessionDetail.SessionId, sessionDetail.SessionNumber);
                    }
                }

                logger.LogInformation(
                    "Bulk processing complete: Created {RecordCount} attendance records for {StudentCount} students " +
                    "across {SessionCount} sessions in ClassSection {ClassSectionId}",
                    attendanceRecordsCreated, studentIds.Count, sessionsProcessed, message.ClassSectionId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Error processing StudentEnrolledMessage for ClassSectionId {ClassSectionId}",
                message.ClassSectionId);
            throw;
        }
    }

    private async Task<int> CreateAttendanceRecordsForSession(
        Guid sessionId,
        List<Guid> studentIds,
        CancellationToken cancellationToken)
    {
        if (studentIds == null || studentIds.Count == 0)
        {
            logger.LogDebug("No student IDs provided for SessionId {SessionId}", sessionId);
            return 0;
        }

        // Log differently for single vs multiple students
        if (studentIds.Count == 1)
            logger.LogDebug(
                "Processing attendance record creation for Student {StudentId} in Session {SessionId}",
                studentIds[0], sessionId);
        else
            logger.LogDebug(
                "Processing attendance record creation for {StudentCount} students in Session {SessionId}. Students: [{StudentIds}]",
                studentIds.Count, sessionId, string.Join(", ", studentIds));

        // Check if attendance records already exist (idempotency)
        var existingRecords = await attendanceRecordRepository
            .GetAttendanceRecordsBySessionIdAsync(sessionId, cancellationToken);

        var existingStudentIds = existingRecords.Select(r => r.StudentId).ToHashSet();
        var studentsNeedingRecords = studentIds
            .Where(studentId => !existingStudentIds.Contains(studentId))
            .ToList();

        if (studentsNeedingRecords.Count == 0)
        {
            if (studentIds.Count == 1)
                logger.LogDebug(
                    "Attendance record already exists for Student {StudentId} in Session {SessionId}. Skipping.",
                    studentIds[0], sessionId);
            else
                logger.LogDebug(
                    "All {StudentCount} students already have attendance records for Session {SessionId}. Skipping.",
                    studentIds.Count, sessionId);
            return 0;
        }

        // Log which students need records
        if (studentsNeedingRecords.Count != studentIds.Count)
        {
            var existingCount = studentIds.Count - studentsNeedingRecords.Count;
            logger.LogDebug(
                "Session {SessionId}: {ExistingCount} students already have records, creating records for {NewCount} students",
                sessionId, existingCount, studentsNeedingRecords.Count);
        }

        // Create Future attendance records for students who don't have records yet
        var futureAttendanceRecords = studentsNeedingRecords.Select(studentId =>
                AttendanceRecord.Create(
                    studentId,
                    sessionId,
                    AttendanceStatus.Future,
                    false,
                    0.0))
            .ToList();

        // Save all future attendance records
        await attendanceRecordRepository.AddRangeAsync(futureAttendanceRecords, cancellationToken);
        await attendanceRecordRepository.SaveChangesAsync(cancellationToken);

        if (studentsNeedingRecords.Count == 1)
            logger.LogInformation(
                "Successfully created Future attendance record for Student {StudentId} in Session {SessionId}",
                studentsNeedingRecords[0], sessionId);
        else
            logger.LogInformation(
                "Successfully created {Count} Future attendance records for Session {SessionId}. Students: [{StudentIds}]",
                futureAttendanceRecords.Count, sessionId, string.Join(", ", studentsNeedingRecords));

        return futureAttendanceRecords.Count;
    }
}