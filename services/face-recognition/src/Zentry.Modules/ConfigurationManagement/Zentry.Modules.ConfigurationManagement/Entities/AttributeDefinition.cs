using System.ComponentModel.DataAnnotations;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Domain;
using DataType = Zentry.SharedKernel.Constants.Configuration.DataType;

namespace Zentry.Modules.ConfigurationManagement.Entities;

public class AttributeDefinition : AggregateRoot<Guid>
{
    public AttributeDefinition() : base(Guid.Empty)
    {
        Key = string.Empty;
        DisplayName = string.Empty;
        DataType = DataType.Int;
        AllowedScopeTypes = [ScopeType.Global];
        DefaultValue = string.Empty;
        IsDeletable = true;
        CreatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
        Options = new List<Option>();
    }

    private AttributeDefinition(Guid id, string key, string displayName, string? description, DataType dataType,
        List<ScopeType> allowedScopeTypes, string? unit, string? defaultValue, bool isDeletable)
        : base(id)
    {
        Key = key;
        DisplayName = displayName;
        Description = description;
        DataType = dataType;
        AllowedScopeTypes = allowedScopeTypes;
        Unit = unit;
        DefaultValue = defaultValue;
        IsDeletable = isDeletable;
        CreatedAt = DateTime.UtcNow;
        Options = new List<Option>();
    }

    [Required]
    [StringLength(100)] // Giới hạn độ dài của key
    public string Key { get; private set; }

    [Required]
    [StringLength(255)] // Giới hạn độ dài của DisplayName
    public string DisplayName { get; private set; }

    [StringLength(1000)] // Giới hạn độ dài của mô tả
    public string? Description { get; private set; }

    [Required] public DataType DataType { get; private set; }

    [StringLength(500)] // Giới hạn độ dài của giá trị mặc định
    public string? DefaultValue { get; private set; }

    public List<ScopeType> AllowedScopeTypes { get; private set; }
    public virtual ICollection<Option> Options { get; private set; }
    public string? Unit { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeletable { get; private set; }

    public static AttributeDefinition Create(string key, string displayName, string? description, DataType dataType,
        List<ScopeType> allowedScopeTypes, string? unit, string? defaultValue, bool isDeletable = true)
    {
        return new AttributeDefinition(Guid.NewGuid(), key, displayName, description, dataType,
            allowedScopeTypes, unit, defaultValue, isDeletable);
    }

    public static AttributeDefinition FromSeedingData(Guid id, string key, string displayName, string? description,
        DataType dataType, List<ScopeType> allowedScopeTypes, string? unit, string? defaultValue,
        bool isDeletable = true)
    {
        return new AttributeDefinition(id, key, displayName, description, dataType,
            allowedScopeTypes, unit, defaultValue, isDeletable);
    }

    public void Update(string? displayName = null, string? description = null, DataType? dataType = null,
        List<ScopeType>? allowedScopeTypes = null, string? unit = null, string? defaultValue = null,
        bool? isDeletable = null)
    {
        if (!string.IsNullOrWhiteSpace(displayName)) DisplayName = displayName;
        if (!string.IsNullOrWhiteSpace(description)) Description = description;
        if (dataType != null) DataType = dataType;
        if (allowedScopeTypes != null) AllowedScopeTypes = allowedScopeTypes;
        if (!string.IsNullOrWhiteSpace(unit)) Unit = unit;
        if (defaultValue != null) DefaultValue = defaultValue;
        if (isDeletable.HasValue) IsDeletable = isDeletable.Value;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetCoreConfig()
    {
        IsDeletable = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void RemoveCoreConfig()
    {
        IsDeletable = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void AddOption(Option option)
    {
        Options.Add(option);
    }

    public void RemoveOption(Option option)
    {
        Options.Remove(option);
    }

    public void SetOptions(List<Option> options)
    {
        Options = options;
    }
}