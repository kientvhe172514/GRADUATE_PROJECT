using MediatR;
using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.UpdatePassword;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class UpdatePasswordCommandHandlerTests : BaseTest<UpdatePasswordCommandHandler>
{
    private readonly UpdatePasswordCommandHandler _handler;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;

    public UpdatePasswordCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        _handler = new UpdatePasswordCommandHandler(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            LoggerMock.Object
        );
    }

    [Fact]
    public async Task Handle_ShouldUpdatePassword_WhenUserAndAccountExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();
        var newPassword = "NewPassword@123";

        var user = User.Create(accountId, "Test User", "0123456789");

        var account = Account.Create("test@example.com", "oldHash", "oldSalt", Role.Student);

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountById(accountId))
            .ReturnsAsync(account);

        _passwordHasherMock.Setup(h => h.HashPassword(newPassword))
            .Returns(("newHash", "newSalt"));

        // Act
        var result = await _handler.Handle(new UpdatePasswordCommand(userId, newPassword), CancellationToken.None);

        // Assert
        Assert.Equal(Unit.Value, result);
        Assert.Equal("newHash", account.PasswordHash);
        Assert.Equal("newSalt", account.PasswordSalt);
        _userRepositoryMock.Verify(r => r.UpdateAccountAsync(account, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenUserNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            _handler.Handle(new UpdatePasswordCommand(userId, "NewPassword@123"), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenAccountNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();

        var user = User.Create(accountId, "Test User", "0123456789");

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountById(accountId))
            .ReturnsAsync((Account?)null);

        // Act & Assert
        await Assert.ThrowsAsync<ResourceNotFoundException>(() =>
            _handler.Handle(new UpdatePasswordCommand(userId, "NewPassword@123"), CancellationToken.None));
    }
}