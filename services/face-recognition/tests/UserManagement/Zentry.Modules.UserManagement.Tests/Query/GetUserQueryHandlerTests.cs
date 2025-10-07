using FluentAssertions;
using Moq;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Features.GetUser;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Tests.Query;

public class GetUserQueryHandlerTests : BaseTest<GetUserQueryHandler>
{
    private readonly GetUserQueryHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock = new();

    public GetUserQueryHandlerTests()
    {
        _handler = new GetUserQueryHandler(_userRepositoryMock.Object, MediatorMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturn_UserResponse_WhenUserExists()
    {
        // Arrange
        var account = Account.Create("test@test.com", "hashed_password", "salt", Role.Student);
        var user = User.Create(account.Id, "Test User", "0123456789");

        _userRepositoryMock.Setup(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.GetAccountByUserId(user.Id))
            .ReturnsAsync(account);

        var attributesResponse = new GetUserAttributesIntegrationResponse(
            new Dictionary<string, string> { { "StudentCode", "S001" } }
        );

        MediatorMock.Setup(m => m.Send(
                It.IsAny<GetUserAttributesIntegrationQuery>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(attributesResponse);

        var query = new GetUserQuery(user.Id);

        // Act
        var response = await _handler.Handle(query, CancellationToken.None);

        // Assert
        response.Should().NotBeNull();
        response.UserId.Should().Be(user.Id);
        response.Email.Should().Be(account.Email);
        response.Code.Should().Be("S001");

        _userRepositoryMock.Verify(r => r.GetByIdAsync(user.Id, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(r => r.GetAccountByUserId(user.Id), Times.Once); // ✅ sửa AccountId -> user.Id
        MediatorMock.Verify(m => m.Send(It.Is<GetUserAttributesIntegrationQuery>(q => q.UserId == user.Id),
            It.IsAny<CancellationToken>()), Times.Once);
    }


    [Fact]
    public async Task Handle_ShouldThrow_ResourceNotFoundException_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User)null!);
        var query = new GetUserQuery(userId);

        // Act & Assert
        await FluentActions.Awaiting(() => _handler.Handle(query, CancellationToken.None))
            .Should().ThrowAsync<ResourceNotFoundException>();
        _userRepositoryMock.Verify(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()), Times.Once);
        _userRepositoryMock.Verify(r => r.GetAccountByUserId(It.IsAny<Guid>()), Times.Never);
    }
}