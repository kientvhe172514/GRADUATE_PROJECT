using TimeZoneConverter;

// Đảm bảo đã cài đặt NuGet package này

namespace Zentry.SharedKernel.Extensions;

public static class DateTimeExtensions
{
    // Múi giờ mặc định cho Việt Nam (Asia/Ho_Chi_Minh là ID IANA chuẩn)
    private static readonly TimeZoneInfo VietnamTimeZone =
        TZConvert.GetTimeZoneInfo("Asia/Ho_Chi_Minh");

    /// <summary>
    ///     Chuyển đổi DateTime UTC sang giờ địa phương Việt Nam.
    /// </summary>
    public static DateTime ToVietnamLocalTime(this DateTime utcDateTime)
    {
        utcDateTime = utcDateTime.Kind switch
        {
            DateTimeKind.Local => utcDateTime.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc),
            _ => utcDateTime
        };

        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, VietnamTimeZone);
    }

    /// <summary>
    ///     Chuyển đổi DateTime đại diện cho giờ địa phương Việt Nam sang UTC.
    ///     Đầu vào `localDateTime` nên có Kind là `Unspecified` hoặc `Local` (sẽ được xử lý).
    /// </summary>
    public static DateTime ToUtcFromVietnamLocalTime(this DateTime localDateTime)
    {
        // Nếu đã là UTC, không cần làm gì nữa
        if (localDateTime.Kind == DateTimeKind.Utc) return localDateTime;

        // Nếu là DateTimeKind.Local (nghĩa là múi giờ của hệ thống server),
        // chúng ta cần chuyển đổi nó sang UTC trước khi áp dụng múi giờ Việt Nam.
        // Đây là để tránh xung đột với TimeZoneInfo.Local
        if (localDateTime.Kind == DateTimeKind.Local)
        {
            // Convert it to UTC based on the system's local time zone
            localDateTime = localDateTime.ToUniversalTime();
            // Sau khi ToUniversalTime, Kind sẽ là Utc, nên sẽ thoát ở if đầu tiên.
            // Để nó xử lý tiếp, chúng ta cần biến nó về Unspecified
            localDateTime = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
        }

        // Tại đây, localDateTime có Kind = Unspecified và giá trị là giờ cục bộ Việt Nam.
        // Chúng ta muốn coi giá trị này là giờ của VietnamTimeZone và chuyển nó về UTC.
        // Cách tốt nhất là sử dụng TimeZoneInfo.ConvertTimeToUtc với DateTimeKind.Unspecified
        // và TimeZoneInfo cụ thể.
        return TimeZoneInfo.ConvertTimeToUtc(localDateTime, VietnamTimeZone);
    }

    /// <summary>
    ///     Chuyển DateOnly (giờ local Việt Nam) thành UTC DateTime range để query database
    ///     Ví dụ: 2025-08-03 (VN) -> UTC: 2025-08-02 17:00:00.000 đến 2025-08-03 16:59:59.999
    /// </summary>
    /// <param name="localDate">Ngày theo múi giờ Việt Nam</param>
    /// <returns>Tuple chứa UTC start và end DateTime</returns>
    public static (DateTime utcStart, DateTime utcEnd) ToUtcRange(this DateOnly localDate)
    {
        // Tạo DateTime từ DateOnly (bắt đầu và kết thúc ngày theo múi giờ VN)
        var localStartOfDay = localDate.ToDateTime(TimeOnly.MinValue); // 00:00:00
        var localEndOfDay = localDate.ToDateTime(TimeOnly.MaxValue); // 23:59:59.999

        // Sử dụng extension method có sẵn để chuyển sang UTC
        var utcStart = localStartOfDay.ToUtcFromVietnamLocalTime();
        var utcEnd = localEndOfDay.ToUtcFromVietnamLocalTime();

        return (utcStart, utcEnd);
    }

    /// <summary>
    ///     Kiểm tra xem một UTC DateTime có nằm trong ngày local Việt Nam hay không
    /// </summary>
    /// <param name="utcDateTime">UTC DateTime cần kiểm tra</param>
    /// <param name="localDate">Ngày local Việt Nam</param>
    /// <returns>True nếu UTC DateTime nằm trong ngày local</returns>
    public static bool IsInVietnamLocalDate(this DateTime utcDateTime, DateOnly localDate)
    {
        var (utcStart, utcEnd) = localDate.ToUtcRange();
        return utcDateTime >= utcStart && utcDateTime <= utcEnd;
    }

    public static DateOnly ToDateOnly(this DateTime dateTime)
    {
        return DateOnly.FromDateTime(dateTime);
    }

    public static TimeOnly ToTimeOnly(this DateTime dateTime)
    {
        return TimeOnly.FromDateTime(dateTime);
    }

    public static DateTime StartOfWeek(this DateTime dt, DayOfWeek startOfWeek)
    {
        var diff = (7 + (dt.DayOfWeek - startOfWeek)) % 7;
        return dt.AddDays(-1 * diff).Date;
    }
}