using MediatR;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Services;
using Zentry.Modules.ScheduleManagement.Domain.Entities;

namespace Zentry.Modules.ScheduleManagement.Application.Tests;

public abstract class BaseCourseTest
{
    protected readonly Mock<IAttendanceCalculationService> AttendanceCalculationServiceMock = new();
    protected readonly Mock<IClassSectionRepository> ClassSectionRepositoryMock = new();
    protected readonly Mock<ICourseRepository> CourseRepositoryMock = new();
    protected readonly Mock<IMediator> MediatorMock = new();
    protected readonly Mock<IScheduleRepository> ScheduleRepositoryMock = new();

    protected static Course CreateTestCourse(string code = "CS101", string name = "Computer Science 101",
        string description = "Introduction to Computer Science")
    {
        return Course.Create(code, name, description);
    }

    protected static CourseDto CreateTestCourseDto(Guid? id = null, string code = "CS101",
        string name = "Computer Science 101", string description = "Introduction to Computer Science")
    {
        return new CourseDto
        {
            Id = id ?? Guid.NewGuid(),
            Code = code,
            Name = name,
            Description = description,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }
}