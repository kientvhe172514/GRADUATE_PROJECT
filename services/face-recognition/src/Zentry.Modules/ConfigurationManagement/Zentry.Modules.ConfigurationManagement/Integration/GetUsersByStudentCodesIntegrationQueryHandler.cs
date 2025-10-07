using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Exceptions;

public class GetUsersByStudentCodesIntegrationQueryHandler(
    ConfigurationDbContext dbContext,
    ILogger<GetUsersByStudentCodesIntegrationQueryHandler> logger)
    : IQueryHandler<GetUsersByStudentCodesIntegrationQuery, GetUsersByStudentCodesIntegrationResponse>
{
    public async Task<GetUsersByStudentCodesIntegrationResponse> Handle(
        GetUsersByStudentCodesIntegrationQuery query,
        CancellationToken cancellationToken)
    {
        if (query.StudentCodes.Count == 0)
            return new GetUsersByStudentCodesIntegrationResponse(new Dictionary<string, Guid>());

        try
        {
            logger.LogInformation("Fetching user IDs for {Count} student codes.", query.StudentCodes.Count);

            var studentCodeAttributeDefinition = await dbContext.AttributeDefinitions
                .AsNoTracking()
                .FirstOrDefaultAsync(ad => ad.Key == "StudentCode", cancellationToken);

            if (studentCodeAttributeDefinition is null)
            {
                logger.LogError("Attribute definition for 'StudentCode' not found.");
                throw new ConfigurationException("Attribute definition for 'StudentCode' not found.");
            }

            var userAttributes = await dbContext.UserAttributes
                .AsNoTracking()
                .Where(ua => ua.AttributeId == studentCodeAttributeDefinition.Id &&
                             query.StudentCodes.Contains(ua.AttributeValue))
                .Select(ua => new
                {
                    StudentCode = ua.AttributeValue,
                    ua.UserId
                })
                .ToListAsync(cancellationToken);

            var studentCodeToUserIdMap = userAttributes
                .ToDictionary(ua => ua.StudentCode, ua => ua.UserId);

            return new GetUsersByStudentCodesIntegrationResponse(studentCodeToUserIdMap);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to fetch user IDs by student codes.");
            return new GetUsersByStudentCodesIntegrationResponse(new Dictionary<string, Guid>());
        }
    }
}