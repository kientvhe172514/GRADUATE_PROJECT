using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Helpers;

public static class DayOfWeekExtensions
{
    public static WeekDayEnum ToWeekDayEnum(this DayOfWeek dayOfWeek)
    {
        // Name của DayOfWeek trùng với Name của WeekDayEnum, chỉ cần chuyển đổi
        // ví dụ: DayOfWeek.Monday.ToString() == "Monday"
        var weekDayName = dayOfWeek.ToString();
        return WeekDayEnum.FromName(weekDayName);
    }
}