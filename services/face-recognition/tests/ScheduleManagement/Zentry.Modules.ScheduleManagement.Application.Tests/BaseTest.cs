using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Infrastructure.Persistence;

namespace Zentry.Modules.ScheduleManagement.Application.Tests;

public abstract class BaseTest<T> where T : class
{
    protected readonly Mock<ScheduleDbContext> DbContextMock = new();
    protected readonly Mock<ILogger<T>> LoggerMock = new();
    protected readonly Mock<IMediator> MediatorMock = new();
}