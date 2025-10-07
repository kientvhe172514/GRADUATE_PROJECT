using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.UpdateFaceId;
using Zentry.Modules.UserManagement.Interfaces;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class UpdateFaceIdCommandHandlerTests : BaseTest<UpdateFaceIdCommandHandler>
{
    private readonly UpdateFaceIdCommandHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock;

    public UpdateFaceIdCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new UpdateFaceIdCommandHandler(_userRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccess_WhenFaceIdRegistered()
    {
        // Arrange
        var user = User.Create(Guid.NewGuid(), "Test User", "123456");
        var command = new UpdateFaceIdCommand(user.Id, true);

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Face ID registered successfully.", result.Message);
        Assert.NotNull(result.LastUpdated);

        _userRepositoryMock.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnError_WhenUserNotFound()
    {
        // Arrange
        var command = new UpdateFaceIdCommand(Guid.NewGuid(), true);

        _userRepositoryMock.Setup(r => r.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Equal("User not found.", result.Message);
        Assert.Null(result.LastUpdated);

        _userRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldUpdate_WhenFaceIdDisabled()
    {
        // Arrange
        var user = User.Create(Guid.NewGuid(), "Test User", "99999");
        var command = new UpdateFaceIdCommand(user.Id, false);

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Face ID status updated.", result.Message);

        // nếu disable thì LastUpdated có thể null
        Assert.Null(result.LastUpdated);

        _userRepositoryMock.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }
}