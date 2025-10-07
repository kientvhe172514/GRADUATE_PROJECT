using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ConfigurationManagement.Entities;

public class Setting : AggregateRoot<Guid>
{
    public Setting() : base(Guid.Empty)
    {
        Value = string.Empty;
        ScopeType = ScopeType.Global;
        ScopeId = Guid.Empty;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    private Setting(Guid id, Guid attributeId, ScopeType scopeType, Guid scopeId, string value)
        : base(id)
    {
        AttributeId = attributeId;
        ScopeType = scopeType;
        ScopeId = scopeId;
        Value = value;
        CreatedAt = DateTime.UtcNow;
    }

    [Required] public Guid AttributeId { get; private set; }

    [Required] public ScopeType ScopeType { get; private set; }

    [Required] public Guid ScopeId { get; private set; }

    [StringLength(255)] // Giới hạn độ dài của giá trị cài đặt
    public string Value { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; set; }
    public virtual AttributeDefinition AttributeDefinition { get; private set; } = null!;

    public static Setting Create(Guid attributeId, ScopeType scopeType, Guid scopeId, string value)
    {
        if (scopeType == ScopeType.Global && scopeId != Guid.Empty)
            throw new ArgumentException("ScopeId must be Guid.Empty for Global ScopeType.");
        if (scopeType != ScopeType.Global && scopeId == Guid.Empty)
            throw new ArgumentException("ScopeId cannot be Guid.Empty for non-Global ScopeType.");

        return new Setting(Guid.NewGuid(), attributeId, scopeType, scopeId, value);
    }

    public static Setting FromSeedingData(Guid id, Guid attributeId, ScopeType scopeType, Guid scopeId, string value)
    {
        if (scopeType == ScopeType.Global && scopeId != Guid.Empty)
            throw new ArgumentException("ScopeId must be Guid.Empty for Global ScopeType in seeding data.");
        if (scopeType != ScopeType.Global && scopeId == Guid.Empty)
            throw new ArgumentException("ScopeId cannot be Guid.Empty for non-Global ScopeType in seeding data.");
        return new Setting(id, attributeId, scopeType, scopeId, value);
    }

    public void UpdateValue(string newValue)
    {
        Value = newValue;
        UpdatedAt = DateTime.UtcNow;
    }
}