using CsvHelper.Configuration;
using Zentry.SharedKernel.Abstractions.Data;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class ScheduleImportDto : BaseImportDto
{
    public string SectionCode { get; set; } = string.Empty;
    public string RoomName { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty; // Format yyyy-MM-dd
    public string EndDate { get; set; } = string.Empty; // Format yyyy-MM-dd
    public string StartTime { get; set; } = string.Empty; // Format HH:mm
    public string EndTime { get; set; } = string.Empty; // Format HH:mm
    public string WeekDay { get; set; } = string.Empty; // Monday, Tuesday...
}

public sealed class ScheduleImportDtoMap : ClassMap<ScheduleImportDto>
{
    public ScheduleImportDtoMap()
    {
        Map(m => m.SectionCode).Name("sectioncode");
        Map(m => m.RoomName).Name("roomname");
        Map(m => m.StartDate).Name("startdate");
        Map(m => m.EndDate).Name("enddate");
        Map(m => m.StartTime).Name("starttime");
        Map(m => m.EndTime).Name("endtime");
        Map(m => m.WeekDay).Name("weekday");

        // CsvHelper sẽ tự động bỏ qua các trường không được khai báo ở đây,
        // bao gồm cả RowIndex được kế thừa từ BaseImportDto.
    }
}