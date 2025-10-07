using System.Text.Json.Serialization;

namespace Zentry.Modules.ScheduleManagement.Application.Dtos;

public class MonthlyCalendarResponseDto
{
    [JsonPropertyName("CalendarDays")] public List<DailyScheduleDto> CalendarDays { get; set; } = new();
}

public class DailyScheduleDto
{
    [JsonPropertyName("Date")] public DateTime Date { get; set; }

    [JsonPropertyName("Classes")] public List<CalendarClassDto> Classes { get; set; } = new();
}

public class CalendarClassDto
{
    [JsonPropertyName("StartTime")] public string StartTime { get; set; } = string.Empty;

    [JsonPropertyName("CourseName")] public string CourseName { get; set; } = string.Empty;

    [JsonPropertyName("SectionCode")] public string SectionCode { get; set; } = string.Empty;

    [JsonPropertyName("RoomName")] public string RoomName { get; set; } = string.Empty;

    [JsonPropertyName("Building")] public string Building { get; set; } = string.Empty;

    [JsonPropertyName("SessionId")] public Guid? SessionId { get; set; }

    [JsonPropertyName("ClassSectionId")] public Guid ClassSectionId { get; set; }
}