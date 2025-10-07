namespace Zentry.SharedKernel.Contracts.Events;

/// <summary>
///     Sự kiện được phát ra khi một round attendance được kích hoạt bởi lecturer.
/// </summary>
public record RoundActivatedEvent
{
    /// <summary>
    ///     ID của session chứa round.
    /// </summary>
    public required Guid SessionId { get; init; }

    /// <summary>
    ///     ID của round được kích hoạt.
    /// </summary>
    public required Guid RoundId { get; init; }

    /// <summary>
    ///     Số thứ tự của round.
    /// </summary>
    public required int RoundNumber { get; init; }

    /// <summary>
    ///     ID của giảng viên kích hoạt round.
    /// </summary>
    public required Guid LecturerId { get; init; }

    /// <summary>
    ///     ID của class section.
    /// </summary>
    public required Guid ClassSectionId { get; init; }

    /// <summary>
    ///     Có yêu cầu face verification hay không.
    /// </summary>
    public bool RequireFaceVerification { get; init; } = true;

    /// <summary>
    ///     Thời gian kích hoạt round.
    /// </summary>
    public DateTime ActivatedAt { get; init; } = DateTime.UtcNow;
}