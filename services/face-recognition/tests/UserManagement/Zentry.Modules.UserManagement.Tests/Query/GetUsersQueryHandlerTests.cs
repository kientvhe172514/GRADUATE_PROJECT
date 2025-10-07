using FluentAssertions;
using Moq;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Features.GetUsers;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Constants.User;

namespace Zentry.Modules.UserManagement.Tests.Query;

public class GetUsersQueryHandlerTests : BaseTest<GetUsersQueryHandler>
{
    private readonly GetUsersQueryHandler _handler;
    private readonly Mock<IUserRepository> _userRepositoryMock = new();

    public GetUsersQueryHandlerTests()
    {
        _handler = new GetUsersQueryHandler(_userRepositoryMock.Object);
    }

    [Fact]
    public async Task Handle_ShouldReturn_UsersAndTotalCount_WhenDataExists()
    {
        // Arrange
        var query = new GetUsersQuery(1, 10);
        var userList = new List<UserListItemDto>
        {
            new()
            {
                UserId = Guid.NewGuid(),
                FullName = "User A",
                Email = "a@test.com",
                Role = Role.Lecturer.ToString()
            },
            new()
            {
                UserId = Guid.NewGuid(),
                FullName = "User B",
                Email = "b@test.com",
                Role = Role.Student.ToString()
            }
        };
        const int totalCount = 2;

        _userRepositoryMock.Setup(r => r.GetUsersAsync(
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<string>(),
                It.IsAny<Role?>(),
                It.IsAny<string?>()))
            .ReturnsAsync((userList, totalCount));

        // Act
        var response = await _handler.Handle(query, CancellationToken.None);

        // Assert
        response.Should().NotBeNull();
        response.Users.Should().HaveCount(totalCount);
        response.TotalCount.Should().Be(totalCount);
        response.PageNumber.Should().Be(1);
        response.PageSize.Should().Be(10);
        _userRepositoryMock.Verify(r => r.GetUsersAsync(1, 10, null, null, null), Times.Once);
    }
}