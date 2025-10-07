namespace Zentry.Infrastructure.Messaging.External;

public interface IMessagePublisher
{
    Task PublishAsync<T>(T message, string queueName, CancellationToken cancellationToken = default);
}