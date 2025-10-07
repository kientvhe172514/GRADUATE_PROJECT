using Zentry.Modules.AttendanceManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.AttendanceManagement.Application.Features.GetStudentFinalAttendance;

public record GetStudentFinalAttendanceQuery(Guid SessionId, Guid StudentId) : IQuery<StudentFinalAttendanceDto>;