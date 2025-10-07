using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Abstractions;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.Modules.ConfigurationManagement.Persistence;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.Configuration;
using Zentry.SharedKernel.Contracts.Attendance;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.ConfigurationManagement.Features.SetSessionAttendanceThreshold;

public class SetSessionAttendanceThresholdHandler(
    ConfigurationDbContext dbContext,
    IAttributeService attributeService,
    IMediator mediator,
    ILogger<SetSessionAttendanceThresholdHandler> logger)
    : ICommandHandler<SetSessionAttendanceThresholdCommand, SetSessionAttendanceThresholdResponse>
{
    private const string AttendanceThresholdKey = "AttendanceThresholdPercentage";

    public async Task<SetSessionAttendanceThresholdResponse> Handle(
        SetSessionAttendanceThresholdCommand command,
        CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            logger.LogInformation("Setting attendance threshold {Threshold}% for session {SessionId}",
                command.ThresholdPercentage, command.SessionId);

            // 1. Validate session exists and has valid status
            var sessionDto = await ValidateSessionAsync(command.SessionId, cancellationToken);

            // 2. Get attendance threshold attribute definition
            var attributeDefinition = await GetAttributeDefinitionAsync(cancellationToken);

            // 3. Validate threshold value
            var thresholdValue = command.ThresholdPercentage.ToString("F1");
            await ValidateThresholdValueAsync(attributeDefinition.Id, thresholdValue, cancellationToken);

            // 4. Create or update session-specific setting
            var (setting, action) = await CreateOrUpdateSettingAsync(
                attributeDefinition.Id,
                command.SessionId,
                thresholdValue,
                cancellationToken);

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Successfully {Action} attendance threshold setting {SettingId} for session {SessionId}: {Threshold}%",
                action, setting.Id, command.SessionId, command.ThresholdPercentage);

            return new SetSessionAttendanceThresholdResponse
            {
                SettingId = setting.Id,
                SessionId = command.SessionId,
                ThresholdPercentage = command.ThresholdPercentage,
                Action = action,
                Timestamp = DateTime.UtcNow,
                SessionStatus = sessionDto.Status
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(ex, "Error setting attendance threshold for session {SessionId}", command.SessionId);
            throw;
        }
    }

    private async Task<SessionByIdDto> ValidateSessionAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var sessionQuery = new GetSessionByIdIntegrationQuery(sessionId);
        var sessionDto = await mediator.Send(sessionQuery, cancellationToken);

        if (sessionDto == null)
        {
            logger.LogWarning("Session {SessionId} not found", sessionId);
            throw new NotFoundException($"Session with ID {sessionId} not found");
        }

        if (!sessionDto.IsEditable)
        {
            logger.LogWarning("Session {SessionId} has status {Status} and cannot be modified",
                sessionId, sessionDto.Status);
            throw new ArgumentException(
                $"Cannot modify attendance threshold for session with status '{sessionDto.Status}'. Only Pending or Active sessions can be modified.");
        }

        logger.LogDebug("Session {SessionId} validated successfully with status {Status}",
            sessionId, sessionDto.Status);

        return sessionDto;
    }

    private async Task<AttributeDefinition> GetAttributeDefinitionAsync(CancellationToken cancellationToken)
    {
        var attributeDefinition = await dbContext.AttributeDefinitions
            .FirstOrDefaultAsync(ad => ad.Key == AttendanceThresholdKey, cancellationToken);

        if (attributeDefinition == null)
        {
            logger.LogError("Attribute definition for key '{Key}' not found", AttendanceThresholdKey);
            throw new NotFoundException($"Attribute definition '{AttendanceThresholdKey}' not found");
        }

        // Verify that Session scope is allowed
        if (!attributeDefinition.AllowedScopeTypes.Contains(ScopeType.Session))
        {
            logger.LogError("Attribute '{Key}' does not allow Session scope", AttendanceThresholdKey);
            throw new ArgumentException($"Attribute '{AttendanceThresholdKey}' does not support Session scope");
        }

        return attributeDefinition;
    }

    private async Task ValidateThresholdValueAsync(Guid attributeId, string value, CancellationToken cancellationToken)
    {
        if (!await attributeService.IsValueValidForAttribute(attributeId, value))
        {
            logger.LogWarning("Invalid threshold value '{Value}' for attribute {AttributeId}", value, attributeId);
            throw new ArgumentException($"Invalid threshold value: {value}");
        }
    }

    private async Task<(Setting Setting, string Action)> CreateOrUpdateSettingAsync(
        Guid attributeId,
        Guid sessionId,
        string thresholdValue,
        CancellationToken cancellationToken)
    {
        // Check if setting already exists for this session
        var existingSetting = await dbContext.Settings
            .FirstOrDefaultAsync(s =>
                    s.AttributeId == attributeId &&
                    s.ScopeType == ScopeType.Session &&
                    s.ScopeId == sessionId,
                cancellationToken);

        if (existingSetting != null)
        {
            // Update existing setting
            existingSetting.UpdateValue(thresholdValue);
            logger.LogDebug("Updated existing setting {SettingId} with new value {Value}",
                existingSetting.Id, thresholdValue);
            return (existingSetting, "Updated");
        }

        // Create new setting
        var newSetting = Setting.Create(
            attributeId,
            ScopeType.Session,
            sessionId,
            thresholdValue);

        await dbContext.Settings.AddAsync(newSetting, cancellationToken);
        logger.LogDebug("Created new setting {SettingId} with value {Value}",
            newSetting.Id, thresholdValue);
        return (newSetting, "Created");
    }
}