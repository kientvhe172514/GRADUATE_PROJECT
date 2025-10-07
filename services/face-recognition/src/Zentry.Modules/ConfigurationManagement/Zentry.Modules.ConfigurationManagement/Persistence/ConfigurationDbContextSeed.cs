using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ConfigurationManagement.Entities;
using Zentry.SharedKernel.Constants.Configuration;

namespace Zentry.Modules.ConfigurationManagement.Persistence;

public static class ConfigurationDbContextSeed
{
    public static async Task SeedAsync(ConfigurationDbContext dbContext, ILogger logger)
    {
        try
        {
            await SeedAttributeDefinitionsAsync(dbContext);
            await SeedSettingsAsync(dbContext);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the Configuration database.");
            throw;
        }
    }

    private static async Task SeedAttributeDefinitionsAsync(ConfigurationDbContext dbContext)
    {
        if (!await dbContext.AttributeDefinitions.AnyAsync())
        {
            var userScope = new List<ScopeType> { ScopeType.User };
            var sessionScope = new List<ScopeType> { ScopeType.Session };
            var globalAndSessionScope = new List<ScopeType> { ScopeType.Global, ScopeType.Session };

            var attributeDefinitions = new List<AttributeDefinition>
            {
                AttributeDefinition.Create(
                    "StudentCode",
                    "Mã số sinh viên",
                    "Mã định danh duy nhất cho sinh viên",
                    DataType.String,
                    userScope,
                    null,
                    null,
                    false),

                AttributeDefinition.Create(
                    "EmployeeCode",
                    "Mã số giảng viên",
                    "Mã định danh duy nhất cho giảng viên",
                    DataType.String,
                    userScope,
                    null,
                    null,
                    false),

                AttributeDefinition.Create(
                    "AttendanceWindowMinutes",
                    "Thời gian cho phép điểm danh",
                    "Thời gian (phút) cho phép điểm danh sau khi bắt đầu phiên học",
                    DataType.Int,
                    sessionScope,
                    "minutes",
                    "15",
                    false),

                AttributeDefinition.Create(
                    "TotalAttendanceRounds",
                    "Số lần điểm danh",
                    "Tổng số lần điểm danh trong một phiên học",
                    DataType.Int,
                    sessionScope,
                    null,
                    "2",
                    false),

                AttributeDefinition.Create(
                    "AbsentReportGracePeriodHours",
                    "Thời gian ân hạn báo vắng",
                    "Thời gian (giờ) ân hạn để báo vắng có lý do sau khi phiên học kết thúc",
                    DataType.Int,
                    sessionScope,
                    "hours",
                    "24",
                    false),

                AttributeDefinition.Create(
                    "ManualAdjustmentGracePeriodHours",
                    "Thời gian ân hạn điều chỉnh",
                    "Thời gian (giờ) ân hạn để điều chỉnh điểm danh thủ công",
                    DataType.Int,
                    sessionScope,
                    "hours",
                    "24",
                    false),

                // New attendance threshold setting
                AttributeDefinition.Create(
                    "AttendanceThresholdPercentage",
                    "Ngưỡng điểm danh tối thiểu (%)",
                    "Tỷ lệ phần trăm tối thiểu để được coi là có mặt trong phiên học",
                    DataType.Decimal,
                    globalAndSessionScope,
                    "%",
                    "75.0",
                    false)
            };

            await dbContext.AttributeDefinitions.AddRangeAsync(attributeDefinitions);
            await dbContext.SaveChangesAsync();
        }
    }

    private static async Task SeedSettingsAsync(ConfigurationDbContext dbContext)
    {
        if (!await dbContext.Settings.AnyAsync())
        {
            var attributeDefinitions = await dbContext.AttributeDefinitions.ToListAsync();
            var settings = new List<Setting>();

            var attendanceWindowId = attributeDefinitions.Single(ad => ad.Key == "AttendanceWindowMinutes").Id;
            var totalRoundsId = attributeDefinitions.Single(ad => ad.Key == "TotalAttendanceRounds").Id;
            var absentReportId = attributeDefinitions.Single(ad => ad.Key == "AbsentReportGracePeriodHours").Id;
            var manualAdjId = attributeDefinitions.Single(ad => ad.Key == "ManualAdjustmentGracePeriodHours").Id;
            var attendanceThresholdId = attributeDefinitions.Single(ad => ad.Key == "AttendanceThresholdPercentage").Id;

            settings.Add(Setting.Create(
                attendanceWindowId,
                ScopeType.Global,
                Guid.Empty,
                "15"));

            settings.Add(Setting.Create(
                totalRoundsId,
                ScopeType.Global,
                Guid.Empty,
                "2"));

            settings.Add(Setting.Create(
                absentReportId,
                ScopeType.Global,
                Guid.Empty,
                "24"));

            settings.Add(Setting.Create(
                manualAdjId,
                ScopeType.Global,
                Guid.Empty,
                "24"));

            // Add global attendance threshold setting
            settings.Add(Setting.Create(
                attendanceThresholdId,
                ScopeType.Global,
                Guid.Empty,
                "75.0"));

            await dbContext.Settings.AddRangeAsync(settings);
            await dbContext.SaveChangesAsync();
        }
    }
}