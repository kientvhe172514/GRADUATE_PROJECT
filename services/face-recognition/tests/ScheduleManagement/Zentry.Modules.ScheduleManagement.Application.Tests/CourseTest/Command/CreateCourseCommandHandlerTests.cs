using Zentry.Modules.ScheduleManagement.Application.Features.Courses.CreateCourse;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Command;

public class CreateCourseCommandHandlerTests : BaseCourseTest
{
    private readonly CreateCourseCommandHandler _handler;

    public CreateCourseCommandHandlerTests()
    {
        _handler = new CreateCourseCommandHandler(CourseRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCourseCodeIsUnique_ShouldCreateCourseSuccessfully()
    {
        // Arrange
        var command = new CreateCourseCommand("Computer Science 101", "CS101", "Introduction to CS");
        CourseRepositoryMock.Setup(x => x.IsCodeUniqueAsync(command.Code, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be(command.Name);
        result.Code.Should().Be(command.Code);
        result.Description.Should().Be(command.Description);
        result.Id.Should().NotBeEmpty();

        CourseRepositoryMock.Verify(x => x.IsCodeUniqueAsync(command.Code, It.IsAny<CancellationToken>()), Times.Once);
        CourseRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()), Times.Once);
        CourseRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCourseCodeAlreadyExists_ShouldThrowResourceAlreadyExistsException()
    {
        // Arrange
        var command = new CreateCourseCommand("Computer Science 101", "CS101", "Introduction to CS");
        CourseRepositoryMock.Setup(x => x.IsCodeUniqueAsync(command.Code, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act & Assert
        var exception =
            await Assert.ThrowsAsync<ResourceAlreadyExistsException>(() =>
                _handler.Handle(command, CancellationToken.None));

        exception.Message.Should().Contain("Course with code 'CS101' already exists.");
        CourseRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()), Times.Never);
        CourseRepositoryMock.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}