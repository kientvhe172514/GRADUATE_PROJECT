using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.UpdateUser;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class UpdateUserCommandHandlerTests : BaseTest<UpdateUserCommandHandler>
{
    private readonly UpdateUserCommandHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock;

    public UpdateUserCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new UpdateUserCommandHandler(_userRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldUpdateUserAndAccount_WhenValid()
    {
        // Arrange
        var account = Account.Create("test@example.com", "hash", "salt", Role.Admin);
        var user = User.Create(account.Id, "Old Name", "12345");

        var command = new UpdateUserCommand(
            user.Id,
            new UpdateUserRequest
            {
                FullName = "New Name",
                PhoneNumber = "67890",
                Role = "Student"
            }
        );

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountById(account.Id))
            .ReturnsAsync(account);

        _userRepositoryMock.Setup(r => r.IsPhoneNumberExist(user.Id, "67890", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _userRepositoryMock.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        _userRepositoryMock.Setup(r => r.UpdateAccountAsync(account, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("User updated successfully.", result.Message);
        Assert.Equal("New Name", user.FullName);
        Assert.Equal("67890", user.PhoneNumber);
        Assert.Equal(Role.Student, account.Role);

        _userRepositoryMock.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(r => r.UpdateAccountAsync(account, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenUserNotFound()
    {
        // Arrange
        var command = new UpdateUserCommand(Guid.NewGuid(), new UpdateUserRequest { FullName = "Test" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(command.UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenAccountNotFound()
    {
        // Arrange
        var accountId = Guid.NewGuid();
        var user = User.Create(accountId, "Test User", "123");

        var command = new UpdateUserCommand(user.Id, new UpdateUserRequest { FullName = "New Name" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountById(accountId))
            .ReturnsAsync((Account?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenPhoneNumberAlreadyExists()
    {
        // Arrange
        var account = Account.Create("test@example.com", "hash", "salt", Role.Admin);
        var user = User.Create(account.Id, "Old Name", "123");

        var command = new UpdateUserCommand(user.Id, new UpdateUserRequest { PhoneNumber = "99999" });

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountById(account.Id))
            .ReturnsAsync(account);

        _userRepositoryMock.Setup(r => r.IsPhoneNumberExist(user.Id, "99999", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceAlreadyExistsException>(() =>
            _handler.Handle(command, CancellationToken.None));
    }
}