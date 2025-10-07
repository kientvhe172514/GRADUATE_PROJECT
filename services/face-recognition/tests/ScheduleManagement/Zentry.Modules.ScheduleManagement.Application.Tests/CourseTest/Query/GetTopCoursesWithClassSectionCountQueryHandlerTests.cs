using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetTopCoursesWithClassSectionCount;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Query;

public class GetTopCoursesWithClassSectionCountQueryHandlerTests : BaseCourseTest
{
    private readonly GetTopCoursesWithClassSectionCountQueryHandler _handler;

    public GetTopCoursesWithClassSectionCountQueryHandlerTests()
    {
        _handler = new GetTopCoursesWithClassSectionCountQueryHandler(ClassSectionRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ValidRequest_ReturnsTopCourses()
    {
        // Arrange
        var query = new GetTopCoursesWithClassSectionCountQuery(5);
        var expectedCourses = new List<CourseWithClassSectionCountDto>
        {
            new()
            {
                CourseId = Guid.NewGuid(),
                CourseName = "Computer Science 101",
                ClassSectionCount = 10
            },
            new()
            {
                CourseId = Guid.NewGuid(),
                CourseName = "Advanced Mathematics",
                ClassSectionCount = 8
            }
        };

        ClassSectionRepositoryMock
            .Setup(x => x.GetTopCoursesWithClassSectionCountAsync(query.Count, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedCourses);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().BeEquivalentTo(expectedCourses);
        ClassSectionRepositoryMock.Verify(
            x => x.GetTopCoursesWithClassSectionCountAsync(query.Count, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task Handle_EmptyResult_ReturnsEmptyList()
    {
        // Arrange
        var query = new GetTopCoursesWithClassSectionCountQuery(5);
        var expectedCourses = new List<CourseWithClassSectionCountDto>();

        ClassSectionRepositoryMock
            .Setup(x => x.GetTopCoursesWithClassSectionCountAsync(query.Count, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedCourses);

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Should().BeEmpty();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(100)]
    public async Task Handle_VariousCountValues_PassesCorrectCountToRepository(int count)
    {
        // Arrange
        var query = new GetTopCoursesWithClassSectionCountQuery(count);
        ClassSectionRepositoryMock
            .Setup(x => x.GetTopCoursesWithClassSectionCountAsync(count, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<CourseWithClassSectionCountDto>());

        // Act
        await _handler.Handle(query, CancellationToken.None);

        // Assert
        ClassSectionRepositoryMock.Verify(
            x => x.GetTopCoursesWithClassSectionCountAsync(count, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}