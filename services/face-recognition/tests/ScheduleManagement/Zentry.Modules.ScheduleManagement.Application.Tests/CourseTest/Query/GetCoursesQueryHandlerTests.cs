using Zentry.Modules.ScheduleManagement.Application.Features.Courses.GetCourses;
using Zentry.Modules.ScheduleManagement.Domain.Entities;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Query;

public class GetCoursesQueryHandlerTests : BaseCourseTest
{
    private readonly GetCoursesQueryHandler _handler;

    public GetCoursesQueryHandlerTests()
    {
        _handler = new GetCoursesQueryHandler(CourseRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnPagedCoursesResponse()
    {
        // Arrange
        var query = new GetCoursesQuery(1, 10, "CS", null, "Name", "asc");
        var courses = new List<Course>
        {
            CreateTestCourse(),
            CreateTestCourse("CS102", "Computer Science 102")
        };
        var totalCount = 2;

        CourseRepositoryMock.Setup(x =>
                x.GetPagedCoursesAsync(It.IsAny<CourseListCriteria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Tuple.Create(courses, totalCount));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Items.Should().HaveCount(2);
        result.TotalCount.Should().Be(2);
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.TotalPages.Should().Be(1);
        result.HasNextPage.Should().BeFalse();
        result.HasPreviousPage.Should().BeFalse();

        result.Items[0].Code.Should().Be("CS101");
        result.Items[0].Name.Should().Be("Computer Science 101");
        result.Items[1].Code.Should().Be("CS102");
        result.Items[1].Name.Should().Be("Computer Science 102");

        CourseRepositoryMock.Verify(x => x.GetPagedCoursesAsync(
            It.Is<CourseListCriteria>(c =>
                c.PageNumber == 1 &&
                c.PageSize == 10 &&
                c.SearchTerm == "CS" &&
                c.SortBy == "Name" &&
                c.SortOrder == "asc"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithDefaultValues_ShouldUseCorrectDefaults()
    {
        // Arrange
        var query = new GetCoursesQuery();
        var courses = new List<Course>();
        var totalCount = 0;

        CourseRepositoryMock.Setup(x =>
                x.GetPagedCoursesAsync(It.IsAny<CourseListCriteria>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Tuple.Create(courses, totalCount));

        // Act
        var result = await _handler.Handle(query, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.PageNumber.Should().Be(1);
        result.PageSize.Should().Be(10);
        result.Items.Should().BeEmpty();
        result.TotalCount.Should().Be(0);

        CourseRepositoryMock.Verify(x => x.GetPagedCoursesAsync(
            It.Is<CourseListCriteria>(c =>
                c.PageNumber == 1 &&
                c.PageSize == 10 &&
                c.SortBy == "CreatedAt" &&
                c.SortOrder == "desc"),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}