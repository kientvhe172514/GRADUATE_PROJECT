using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourseById;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Query;

public class GetCourseByIdQueryHandlerTests : BaseCourseTest
{
    private readonly GetCourseByIdQueryHandler _handler;

    public GetCourseByIdQueryHandlerTests()
    {
        _handler = new GetCourseByIdQueryHandler(CourseRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_WhenCourseExists_ShouldReturnCourseDto()
    {
        // Arrange
        var course = CreateTestCourse();
        var query = new GetCourseByIdQuery(course.Id);

        CourseRepositoryMock.Setup(x => x.GetByIdAsync(course.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(course);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(course.Id);
        result.Code.Should().Be(course.Code);
        result.Name.Should().Be(course.Name);
        result.Description.Should().Be(course.Description);
        result.CreatedAt.Should().Be(course.CreatedAt);
        result.UpdatedAt.Should().Be(course.UpdatedAt);

        CourseRepositoryMock.Verify(x => x.GetByIdAsync(course.Id, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCourseNotFound_ShouldThrowResourceNotFoundException()
    {
        // Arrange
        var courseId = Guid.NewGuid();
        var query = new GetCourseByIdQuery(courseId);

        CourseRepositoryMock.Setup(x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Course?)null);

        // Act & Assert
        var exception =
            await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(query, CancellationToken.None));

        exception.Message.Should().Contain("Course");
        exception.Message.Should().Contain(courseId.ToString());
    }
}