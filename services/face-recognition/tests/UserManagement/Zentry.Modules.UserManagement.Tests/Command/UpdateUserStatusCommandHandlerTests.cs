using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.UpdateUserStatus;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class UpdateUserStatusCommandHandlerTests : BaseTest<UpdateUserStatusCommandHandler>
{
    private readonly UpdateUserStatusCommandHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock;

    public UpdateUserStatusCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new UpdateUserStatusCommandHandler(
            _userRepositoryMock.Object,
            MediatorMock.Object,
            LoggerMock.Object
        );
    }

    [Fact]
    public async Task Handle_ShouldUpdateStatus_WhenValid()
    {
        // Arrange
        var account = Account.Create("test@example.com", "hash", "salt", Role.Admin);
        var user = User.Create(account.Id, "Test User", "12345");

        var command = new UpdateUserStatusCommand(user.Id, new UpdateUserStatusRequest { Status = "Locked" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.GetAccountById(account.Id))
            .ReturnsAsync(account);
        _userRepositoryMock.Setup(r => r.UpdateAccountAsync(account, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("User status updated successfully.", result.Message);
        Assert.Equal(AccountStatus.Locked, account.Status);
        _userRepositoryMock.Verify(r => r.UpdateAccountAsync(account, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenUserNotFound()
    {
        var command = new UpdateUserStatusCommand(Guid.NewGuid(), new UpdateUserStatusRequest { Status = "Active" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenAccountNotFound()
    {
        var user = User.Create(Guid.NewGuid(), "Test", "123");
        var command = new UpdateUserStatusCommand(user.Id, new UpdateUserStatusRequest { Status = "Active" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.GetAccountById(user.AccountId))
            .ReturnsAsync((Account?)null);

        await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenInvalidStatus()
    {
        var account = Account.Create("test@example.com", "hash", "salt", Role.Admin);
        var user = User.Create(account.Id, "Test", "123");
        var command = new UpdateUserStatusCommand(user.Id, new UpdateUserStatusRequest { Status = "NotARealStatus" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.GetAccountById(account.Id))
            .ReturnsAsync(account);

        await Assert.ThrowsAsync<BusinessRuleException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldReturnSuccess_WhenStatusAlreadySame()
    {
        var account = Account.Create("test@example.com", "hash", "salt", Role.Admin);
        var user = User.Create(account.Id, "Test", "123");
        var command = new UpdateUserStatusCommand(user.Id, new UpdateUserStatusRequest { Status = "Active" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.GetAccountById(account.Id))
            .ReturnsAsync(account);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.Success);
        Assert.Equal("User status is already up to date.", result.Message);
        _userRepositoryMock.Verify(r => r.UpdateAccountAsync(It.IsAny<Account>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }
}