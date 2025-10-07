using Zentry.Modules.ScheduleManagement.Application.Features.Courses.UpdateCourse;
using Zentry.Modules.ScheduleManagement.Domain.Entities;

namespace Zentry.Modules.ScheduleManagement.Application.Tests.CourseTest.Command;

public class UpdateCourseCommandHandlerTests : BaseCourseTest
{
    private readonly UpdateCourseCommandHandler _handler;

    public UpdateCourseCommandHandlerTests()
    {
        _handler = new UpdateCourseCommandHandler(CourseRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ValidCommand_UpdatesCourseAndReturnsDto()
    {
        // Arrange
        var courseId = Guid.NewGuid();
        var existingCourse = CreateTestCourse("CS101", "Old Name", "Old Description");
        var request = new UpdateCourseRequest
        {
            Name = "Updated Computer Science 101",
            Description = "Updated description"
        };
        var command = new UpdateCourseCommand(courseId, request);

        CourseRepositoryMock
            .Setup(x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCourse);

        CourseRepositoryMock
            .Setup(x => x.UpdateAsync(It.IsAny<Course>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().Be(existingCourse.Id);
        result.Code.Should().Be(existingCourse.Code);
        result.Name.Should().Be(request.Name);
        result.Description.Should().Be(request.Description);

        CourseRepositoryMock.Verify(
            x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()),
            Times.Once);
        CourseRepositoryMock.Verify(
            x => x.UpdateAsync(existingCourse, It.IsAny<CancellationToken>()),
            Times.Once);
    }


    [Fact]
    public async Task Handle_PartialUpdate_OnlyUpdatesProvidedFields()
    {
        // Arrange
        var courseId = Guid.NewGuid();
        var existingCourse = CreateTestCourse("CS101", "Original Name", "Original Description");
        var originalName = existingCourse.Name;
        var request = new UpdateCourseRequest
        {
            Description = "Updated description only"
            // Name is null, should not be updated
        };
        var command = new UpdateCourseCommand(courseId, request);

        CourseRepositoryMock
            .Setup(x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCourse);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Name.Should().Be(originalName); // Name should remain unchanged
        result.Description.Should().Be(request.Description);
    }

    [Fact]
    public async Task Handle_EmptyStrings_DoesNotUpdateFields()
    {
        // Arrange
        var courseId = Guid.NewGuid();
        var existingCourse = CreateTestCourse("CS101", "Original Name", "Original Description");
        var originalName = existingCourse.Name;
        var originalDescription = existingCourse.Description;
        var request = new UpdateCourseRequest
        {
            Name = "",
            Description = "   " // Whitespace only
        };
        var command = new UpdateCourseCommand(courseId, request);

        CourseRepositoryMock
            .Setup(x => x.GetByIdAsync(courseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCourse);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        result.Name.Should().Be(originalName);
        result.Description.Should().Be(originalDescription);
    }
}

public class UpdateCourseCommandValidatorTests
{
    private readonly UpdateCourseCommandValidator _validator = new();

    [Fact]
    public void Validate_ValidRequest_PassesValidation()
    {
        // Arrange
        var request = new UpdateCourseRequest
        {
            Name = "Valid Course Name",
            Description = "Valid description"
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_EmptyOrNullName_FailsValidation(string? name)
    {
        // Arrange
        var request = new UpdateCourseRequest
        {
            Name = name,
            Description = "Valid description"
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(x => x.ErrorMessage == "Tên khóa học là bắt buộc.");
    }

    [Fact]
    public void Validate_NameTooLong_FailsValidation()
    {
        // Arrange
        var longName = new string('A', 201); // 201 characters
        var request = new UpdateCourseRequest
        {
            Name = longName,
            Description = "Valid description"
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(x => x.ErrorMessage == "Tên khóa học không được vượt quá 200 ký tự.");
    }

    [Fact]
    public void Validate_DescriptionTooLong_FailsValidation()
    {
        // Arrange
        var longDescription = new string('A', 501); // 501 characters
        var request = new UpdateCourseRequest
        {
            Name = "Valid Name",
            Description = longDescription
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().ContainSingle(x => x.ErrorMessage == "Mô tả khóa học không được vượt quá 500 ký tự.");
    }

    [Fact]
    public void Validate_NullDescription_PassesValidation()
    {
        // Arrange
        var request = new UpdateCourseRequest
        {
            Name = "Valid Name",
            Description = null
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_EmptyDescription_PassesValidation()
    {
        // Arrange
        var request = new UpdateCourseRequest
        {
            Name = "Valid Name",
            Description = ""
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Validate_BoundaryValues_PassesValidation()
    {
        // Arrange
        var request = new UpdateCourseRequest
        {
            Name = new string('A', 200), // Exactly 200 characters
            Description = new string('B', 500) // Exactly 500 characters
        };

        // Act
        var result = _validator.Validate(request);

        // Assert
        result.IsValid.Should().BeTrue();
    }
}