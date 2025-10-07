using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ConfigurationManagement.Entities;

public class Option : AggregateRoot<Guid>
{
    public Option() : base(Guid.Empty)
    {
        Value = string.Empty;
        DisplayLabel = string.Empty;
        SortOrder = 0;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    private Option(Guid id, Guid attributeId, string value, string displayLabel, int sortOrder)
        : base(id)
    {
        AttributeId = attributeId;
        Value = value;
        DisplayLabel = displayLabel;
        SortOrder = sortOrder;
        CreatedAt = DateTime.UtcNow;
    }

    [Required] public Guid AttributeId { get; private set; }

    [Required]
    [StringLength(255)] // Giới hạn độ dài của giá trị
    public string Value { get; private set; }

    [Required]
    [StringLength(255)] // Giới hạn độ dài của nhãn hiển thị
    public string DisplayLabel { get; private set; }

    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; set; }

    public virtual AttributeDefinition AttributeDefinition { get; private set; } = null!;

    public static Option Create(Guid attributeId, string value, string displayLabel, int sortOrder)
    {
        return new Option(Guid.NewGuid(), attributeId, value, displayLabel, sortOrder);
    }

    public static Option FromSeedingData(Guid id, Guid attributeId, string value, string displayLabel, int sortOrder)
    {
        return new Option(id, attributeId, value, displayLabel, sortOrder);
    }

    public void Update(string? value = null, string? displayLabel = null, int? sortOrder = null)
    {
        if (!string.IsNullOrWhiteSpace(value)) Value = value;
        if (!string.IsNullOrWhiteSpace(displayLabel)) DisplayLabel = displayLabel;
        if (sortOrder.HasValue) SortOrder = sortOrder.Value;
        UpdatedAt = DateTime.UtcNow;
    }
}