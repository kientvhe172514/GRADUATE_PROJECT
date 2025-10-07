using MediatR;
using Microsoft.Extensions.Logging;
using Moq;
using Zentry.Modules.UserManagement.Persistence.DbContext;

namespace Zentry.Modules.UserManagement.Tests;

public abstract class BaseTest<T> where T : class
{
    protected readonly Mock<UserDbContext> DbContextMock = new();
    protected readonly Mock<ILogger<T>> LoggerMock = new();
    protected readonly Mock<IMediator> MediatorMock = new();
}