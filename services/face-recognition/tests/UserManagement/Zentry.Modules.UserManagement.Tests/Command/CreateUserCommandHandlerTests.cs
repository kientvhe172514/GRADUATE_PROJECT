using FluentAssertions;
using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.CreateUser;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Command;

public class CreateUserCommandHandlerTests : BaseTest<CreateUserCommandHandler>
{
    private readonly CreateUserCommandHandler _handler;
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();

    public CreateUserCommandHandlerTests()
    {
        _handler = new CreateUserCommandHandler(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            MediatorMock.Object,
            LoggerMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldCreateUser_Successfully()
    {
        // Arrange
        var request = new CreateUserRequest
        {
            Email = "test@test.com",
            Password = "Password123!",
            FullName = "Test User",
            Role = "Student"
        };
        var command = new CreateUserCommand(request);

        _userRepositoryMock.Setup(r => r.IsExistsByEmail(null, request.Email)).ReturnsAsync(false);
        _passwordHasherMock.Setup(h => h.HashPassword(request.Password)).Returns(("hashed", "salt"));

        MediatorMock.Setup(m => m.Send(
                It.IsAny<CreateUserAttributesIntegrationCommand>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateUserAttributesIntegrationResponse(true, "Success", null));

        MediatorMock.Setup(m => m.Send(
                It.IsAny<GetUserAttributesIntegrationQuery>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GetUserAttributesIntegrationResponse(new Dictionary<string, string>()));

        var response = await _handler.Handle(command, CancellationToken.None);

        response.Should().NotBeNull();
        response.Email.Should().Be(request.Email);
        response.FullName.Should().Be(request.FullName);
        _userRepositoryMock.Verify(
            r => r.AddAsync(It.IsAny<Account>(), It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Once);
        MediatorMock.Verify(
            m => m.Send(It.IsAny<CreateUserAttributesIntegrationCommand>(), It.IsAny<CancellationToken>()), Times.Once);
        MediatorMock.Verify(
            m => m.Send(It.IsAny<GetUserAttributesIntegrationQuery>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldThrow_ResourceNotFoundException_WhenEmailExists()
    {
        var request = new CreateUserRequest
        {
            Email = "existing@test.com",
            Password = "Password123!",
            FullName = "Existing User",
            Role = "Student"
        };
        var command = new CreateUserCommand(request);

        _userRepositoryMock.Setup(r => r.IsExistsByEmail(null, request.Email)).ReturnsAsync(true);

        await FluentActions.Awaiting(() => _handler.Handle(command, CancellationToken.None))
            .Should().ThrowAsync<ResourceNotFoundException>();
        _userRepositoryMock.Verify(
            r => r.AddAsync(It.IsAny<Account>(), It.IsAny<User>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}