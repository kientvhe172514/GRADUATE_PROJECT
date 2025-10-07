using Zentry.Modules.ScheduleManagement.Application.Features.Courses.DeleteCourse;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Command;

public class DeleteCourseCommandHandlerTests : BaseCourseTest
{
    private readonly DeleteCourseCommandHandler _handler;

    public DeleteCourseCommandHandlerTests()
    {
        _handler = new DeleteCourseCommandHandler(
            CourseRepositoryMock.Object,
            ClassSectionRepositoryMock.Object,
            ScheduleRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCourseNotFound_ShouldThrowResourceNotFoundException()
    {
        // Arrange
        var courseId = Guid.NewGuid();
        var command = new DeleteCourseCommand(courseId);
        CourseRepositoryMock.Setup(x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course?)null);

        // Act & Assert
        var exception =
            await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(command, CancellationToken.None));

        exception.Message.Should().Contain("Course");
        exception.Message.Should().Contain(courseId.ToString());
    }

    [Fact]
    public async Task Handle_WhenCourseHasNoClassSections_ShouldHardDeleteCourse()
    {
        // Arrange
        var course = CreateTestCourse();
        var command = new DeleteCourseCommand(course.Id);

        CourseRepositoryMock.Setup(x => x.GetByIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(course);
        ClassSectionRepositoryMock
            .Setup(x => x.IsExistClassSectionByCourseIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        CourseRepositoryMock.Verify(x => x.DeleteAsync(course, It.IsAny<CancellationToken>()), Times.Once);
        CourseRepositoryMock.Verify(x => x.SoftDeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task Handle_WhenCourseHasClassSectionsButNoActiveSchedules_ShouldSoftDeleteCourse()
    {
        // Arrange
        var course = CreateTestCourse();
        var command = new DeleteCourseCommand(course.Id);

        CourseRepositoryMock.Setup(x => x.GetByIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(course);
        ClassSectionRepositoryMock
            .Setup(x => x.IsExistClassSectionByCourseIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        ScheduleRepositoryMock.Setup(x => x.HasActiveScheduleInTermAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        CourseRepositoryMock.Verify(x => x.SoftDeleteAsync(course.Id, It.IsAny<CancellationToken>()), Times.Once);
        CourseRepositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenCourseHasActiveSchedules_ShouldThrowResourceCannotBeDeletedException()
    {
        // Arrange
        var course = CreateTestCourse();
        var command = new DeleteCourseCommand(course.Id);

        CourseRepositoryMock.Setup(x => x.GetByIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(course);
        ClassSectionRepositoryMock
            .Setup(x => x.IsExistClassSectionByCourseIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        ScheduleRepositoryMock.Setup(x => x.HasActiveScheduleInTermAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        var exception =
            await Assert.ThrowsAsync<ResourceCannotBeDeletedException>(() =>
                _handler.Handle(command, CancellationToken.None));

        exception.Message.Should().Contain($"Course with ID '{course.Id}' can not be deleted.");
        CourseRepositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()), Times.Never);
        CourseRepositoryMock.Verify(x => x.SoftDeleteAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}