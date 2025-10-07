using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTotalCourseCount;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Query;

public class GetTotalCourseCountQueryHandlerTests : BaseCourseTest
{
    private readonly GetTotalCourseCountQueryHandler _handler;

    public GetTotalCourseCountQueryHandlerTests()
    {
        _handler = new GetTotalCourseCountQueryHandler(CourseRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReturnsTotalCount()
    {
        // Arrange
        var query = new GetTotalCourseCountQuery();
        var expectedCount = 25;

        CourseRepositoryMock
            .Setup(x => x.CountTotalCoursesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedCount);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().Be(expectedCount);
        CourseRepositoryMock.Verify(
            x => x.CountTotalCoursesAsync(It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_NoCourses_ReturnsZero()
    {
        // Arrange
        var query = new GetTotalCourseCountQuery();
        CourseRepositoryMock
            .Setup(x => x.CountTotalCoursesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(0);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CancellationRequested_PropagatesCancellationToken()
    {
        // Arrange
        var query = new GetTotalCourseCountQuery();
        var cancellationToken = new CancellationToken(true);

        CourseRepositoryMock
            .Setup(x => x.CountTotalCoursesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new OperationCanceledException());

        // Act & Assert
        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            _handler.Handle(query, cancellationToken));
    }
}