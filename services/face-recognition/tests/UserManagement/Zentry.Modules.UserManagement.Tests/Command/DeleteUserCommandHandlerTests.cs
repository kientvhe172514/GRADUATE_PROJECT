using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.DeleteUser;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class DeleteUserCommandHandlerTests : BaseTest<DeleteUserCommandHandler>
{
    private readonly DeleteUserCommandHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock;

    public DeleteUserCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new DeleteUserCommandHandler(_userRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenUserNotFound()
    {
        // Arrange
        var command = new DeleteUserCommand(Guid.NewGuid());
        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenAccountIsNull()
    {
        // Arrange
        var user = User.Create(Guid.NewGuid(), "Test User", "0123456789");
        user.Account = null; // account null

        var command = new DeleteUserCommand(user.Id);
        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenAccountIsNotActive()
    {
        // Arrange
        var account = Account.Create("test@email.com", "hash", "salt", Role.Student);
        account.UpdateStatus(AccountStatus.Inactive);

        var user = User.Create(account.Id, "Test User", "0123456789");
        user.Account = account;

        var command = new DeleteUserCommand(user.Id);
        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldSoftDelete_WhenUserAndAccountValid()
    {
        // Arrange
        var account = Account.Create("test@email.com", "hash", "salt", Role.Student);
        var user = User.Create(account.Id, "Test User", "0123456789");
        user.Account = account;

        var command = new DeleteUserCommand(user.Id);
        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock
            .Setup(repo => repo.SoftDeleteUserAsync(command.UserId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("User soft deleted successfully.", result.Message);
        _userRepositoryMock.Verify(repo =>
                repo.SoftDeleteUserAsync(command.UserId, It.IsAny<CancellationToken>()),
            Times.Once);
    }
}