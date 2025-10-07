using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.AttendanceManagement.Application.Abstractions;
using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.Modules.AttendanceManagement.Domain.Entities;
using Zentry.Modules.AttendanceManagement.Domain.ValueObjects;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Attendance;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetStudentFinalAttendance;

public class GetStudentFinalAttendanceQueryHandler(
    ISessionRepository sessionRepository,
    IRoundRepository roundRepository,
    IStudentTrackRepository studentTrackRepository,
    IAttendanceRecordRepository attendanceRecordRepository,
    IMediator mediator,
    ILogger<GetStudentFinalAttendanceQueryHandler> logger)
    : IQueryHandler<GetStudentFinalAttendanceQuery, StudentFinalAttendanceDto>
{
    private const string StudentCodeKey = "StudentCode";

    public async Task<StudentFinalAttendanceDto> Handle(GetStudentFinalAttendanceQuery request,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Handling GetStudentFinalAttendanceQuery for SessionId: {SessionId}, StudentId: {StudentId}",
            request.SessionId, request.StudentId);

        // Lấy thông tin session
        var session = await sessionRepository.GetByIdAsync(request.SessionId, cancellationToken);
        if (session is null)
            throw new NotFoundException("Session", $"Phiên học với ID '{request.SessionId}' không tìm thấy.");

        var sessionStatus = session.Status.ToString();

        // Lấy thông tin student
        var studentInfo = await mediator.Send(
            new GetUserByIdAndRoleIntegrationQuery(request.StudentId, Role.Student),
            cancellationToken);

        if (studentInfo == null)
        {
            logger.LogWarning("Student with ID {StudentId} not found.", request.StudentId);
            throw new NotFoundException("Student", $"Sinh viên với ID '{request.StudentId}' không tìm thấy.");
        }

        // Kiểm tra xem có AttendanceRecord hay không
        var attendanceRecord = await attendanceRecordRepository.GetByUserIdAndSessionIdAsync(
            request.StudentId, request.SessionId, cancellationToken);

        if (attendanceRecord != null)
            // Sử dụng AttendanceRecord để tính toán
            return await CreateAttendanceDtoFromRecord(request, studentInfo, sessionStatus, attendanceRecord,
                cancellationToken);

        // Fallback về logic cũ sử dụng rounds
        return await CreateAttendanceDtoFromRounds(request, studentInfo, sessionStatus, cancellationToken);
    }

    private async Task<StudentFinalAttendanceDto> CreateAttendanceDtoFromRecord(
        GetStudentFinalAttendanceQuery request,
        GetUserByIdAndRoleIntegrationResponse studentInfo,
        string sessionStatus,
        AttendanceRecord attendanceRecord,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Using AttendanceRecord for final attendance calculation for StudentId: {StudentId}, SessionId: {SessionId}",
            request.StudentId, request.SessionId);

        // Lấy thông tin rounds để tạo RoundDetails (nếu cần)
        var allRounds = await roundRepository.GetRoundsBySessionIdAsync(request.SessionId, cancellationToken);
        var totalRounds = allRounds.Select(r =>
            !Equals(r.Status, RoundStatus.Cancelled) && !Equals(r.Status, RoundStatus.Finalized)).ToList().Count;

        // Lấy thông tin student track để có thông tin chi tiết về rounds
        var studentTrack = await studentTrackRepository.GetBySessionIdAndUserIdAsync(
            request.SessionId, request.StudentId, cancellationToken);

        var attendedRounds = studentTrack?.Rounds.ToDictionary(r => r.RoundId) ??
                             new Dictionary<Guid, RoundParticipation>();

        // Tính toán round details
        var (roundDetails, attendedRoundsCount) = CalculateRoundDetails(allRounds, attendedRounds);

        var studentCode = GetStudentCode(studentInfo.Attributes);

        return new StudentFinalAttendanceDto
        {
            StudentId = request.StudentId,
            StudentCode = studentCode,
            FullName = studentInfo.FullName,
            SessionId = request.SessionId,
            SessionStatus = sessionStatus,
            FinalAttendancePercentage = attendanceRecord.PercentageAttended,
            TotalRounds = totalRounds,
            AttendedRoundsCount = attendedRoundsCount,
            MissedRoundsCount = totalRounds - attendedRoundsCount,
            FinalStatus = attendanceRecord.Status.ToString(),
            RoundDetails = roundDetails
        };
    }

    private async Task<StudentFinalAttendanceDto> CreateAttendanceDtoFromRounds(
        GetStudentFinalAttendanceQuery request,
        GetUserByIdAndRoleIntegrationResponse studentInfo,
        string sessionStatus,
        CancellationToken cancellationToken)
    {
        logger.LogInformation(
            "Using Rounds for final attendance calculation for StudentId: {StudentId}, SessionId: {SessionId}",
            request.StudentId, request.SessionId);

        // Lấy thông tin rounds
        var allRounds = await roundRepository.GetRoundsBySessionIdAsync(request.SessionId, cancellationToken);
        var totalRounds = allRounds.Count;

        // Nếu không có rounds, trả về kết quả mặc định
        if (totalRounds == 0)
        {
            logger.LogWarning("No rounds found for SessionId: {SessionId}.", request.SessionId);
            return CreateDefaultAttendanceDto(request, studentInfo, sessionStatus);
        }

        // Lấy thông tin attendance của student
        var studentTrack = await studentTrackRepository.GetBySessionIdAndUserIdAsync(
            request.SessionId, request.StudentId, cancellationToken);

        var attendedRounds = studentTrack?.Rounds.ToDictionary(r => r.RoundId) ??
                             new Dictionary<Guid, RoundParticipation>();

        // Tính toán attendance details
        var (roundDetails, attendedRoundsCount) = CalculateRoundDetails(allRounds, attendedRounds);

        var finalPercentage = totalRounds > 0 ? (double)attendedRoundsCount / totalRounds * 100 : 0;
        var studentCode = GetStudentCode(studentInfo.Attributes);

        return new StudentFinalAttendanceDto
        {
            StudentId = request.StudentId,
            StudentCode = studentCode,
            FullName = studentInfo.FullName,
            SessionId = request.SessionId,
            SessionStatus = sessionStatus,
            FinalAttendancePercentage = finalPercentage,
            TotalRounds = totalRounds,
            AttendedRoundsCount = attendedRoundsCount,
            MissedRoundsCount = totalRounds - attendedRoundsCount,
            FinalStatus = AttendanceStatus.Future.ToString(),
            RoundDetails = roundDetails
        };
    }

    private static StudentFinalAttendanceDto CreateDefaultAttendanceDto(
        GetStudentFinalAttendanceQuery request,
        GetUserByIdAndRoleIntegrationResponse studentInfo,
        string sessionStatus)
    {
        var studentCode = GetStudentCode(studentInfo.Attributes);

        return new StudentFinalAttendanceDto
        {
            StudentId = request.StudentId,
            StudentCode = studentCode,
            FullName = studentInfo.FullName,
            SessionId = request.SessionId,
            SessionStatus = sessionStatus,
            FinalAttendancePercentage = 0,
            TotalRounds = 0,
            AttendedRoundsCount = 0,
            MissedRoundsCount = 0,
            FinalStatus = AttendanceStatus.Future.ToString(),
            RoundDetails = []
        };
    }

    private static (List<RoundAttendanceDetailDto> roundDetails, int attendedCount) CalculateRoundDetails(
        IReadOnlyList<Round> allRounds,
        Dictionary<Guid, RoundParticipation> attendedRounds)
    {
        var roundDetails = new List<RoundAttendanceDetailDto>();
        var attendedRoundsCount = 0;

        foreach (var round in allRounds)
        {
            var isAttended = attendedRounds.TryGetValue(round.Id, out var participation) && participation.IsAttended;
            if (isAttended) attendedRoundsCount++;

            roundDetails.Add(new RoundAttendanceDetailDto
            {
                RoundId = round.Id,
                RoundNumber = round.RoundNumber,
                IsAttended = isAttended,
                AttendedTime = participation?.AttendedTime
            });
        }

        return (roundDetails, attendedRoundsCount);
    }

    private static string GetStudentCode(Dictionary<string, string> attributes)
    {
        if (attributes.TryGetValue(StudentCodeKey, out var studentCode) &&
            !string.IsNullOrEmpty(studentCode))
            return studentCode;

        return string.Empty;
    }
}