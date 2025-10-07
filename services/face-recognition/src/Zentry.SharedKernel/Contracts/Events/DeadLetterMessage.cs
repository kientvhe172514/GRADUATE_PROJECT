namespace Zentry.SharedKernel.Contracts.Events;

public record DeadLetterMessage
{
    public string OriginalMessageId { get; init; }
    public string OriginalMessageType { get; init; }
    public string ErrorMessage { get; init; }
    public DateTime Timestamp { get; init; }
}