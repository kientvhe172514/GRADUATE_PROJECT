using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Zentry.Modules.ConfigurationManagement.Abstractions;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Services;

public class AttributeService(ConfigurationDbContext dbContext) : IAttributeService
{
    public async Task<AttributeDefinition?> GetAttributeDefinitionByIdAsync(Guid id)
    {
        return await dbContext.AttributeDefinitions.FirstOrDefaultAsync(ad => ad.Id == id);
    }

    public async Task<IEnumerable<Option>> GetOptionsByAttributeIdAsync(Guid attributeId)
    {
        return await dbContext.Options.Where(o => o.AttributeId == attributeId).ToListAsync();
    }

    public async Task<bool> IsValueValidForAttribute(Guid attributeId, string value)
    {
        var attributeDefinition = await GetAttributeDefinitionByIdAsync(attributeId);
        if (attributeDefinition == null)
            throw new ArgumentException($"Attribute Definition with ID '{attributeId}' not found.");

        // So sánh DataType với các Smart Enum instances
        if (attributeDefinition.DataType.Equals(DataType.String)) return true;

        if (attributeDefinition.DataType.Equals(DataType.Int)) return int.TryParse(value, out _);

        if (attributeDefinition.DataType.Equals(DataType.Boolean)) return bool.TryParse(value, out _);

        if (attributeDefinition.DataType.Equals(DataType.Decimal)) return decimal.TryParse(value, out _);

        if (attributeDefinition.DataType.Equals(DataType.Date)) return DateTime.TryParse(value, out _);

        if (attributeDefinition.DataType.Equals(DataType.Json))
            return await IsValueValidAsJsonOption(attributeId, value);

        if (attributeDefinition.DataType.Equals(DataType.Selection))
            return await IsValueValidForSelectionAttribute(attributeId, value);

        return false; // Unknown data type
    }

    private async Task<bool> IsValueValidForSelectionAttribute(Guid attributeId, string value)
    {
        // Lấy tất cả các options cho attribute này
        var options = await dbContext.Options
            .Where(o => o.AttributeId == attributeId)
            .ToListAsync();

        // Kiểm tra xem value có khớp với bất kỳ option.Value nào không
        return options.Any(o => o.Value.Equals(value, StringComparison.OrdinalIgnoreCase));
    }


    private async Task<bool> IsValueValidAsJsonOption(Guid attributeId, string value)
    {
        // Kiểm tra xem value có phải là JSON hợp lệ không
        try
        {
            using var document = JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}