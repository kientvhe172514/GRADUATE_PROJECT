using System.Text.Json;
using System.Text.Json.Serialization;
using Zentry.SharedKernel.Extensions;

namespace Zentry.SharedKernel.Helpers;

public class DateTimeToLocalConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        // Khi đọc từ JSON, bạn thường muốn giữ nguyên giá trị hoặc chuyển về UTC
        // Giả định bạn đang nhận chuỗi yyyy-MM-dd HH:mm:ss và muốn coi nó là local time
        if (reader.TokenType == JsonTokenType.String)
            if (DateTime.TryParse(reader.GetString(), out var dateTime))
                // Giả định chuỗi đến là giờ local của Việt Nam
                // Convert nó sang UTC trước khi sử dụng trong logic backend
                return dateTime.ToUtcFromVietnamLocalTime(); // Sử dụng hàm bạn đã định nghĩa

        return default;
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        // Đây là nơi bạn định dạng DateTime khi trả về client
        // Bước 1: Chuyển đổi DateTime từ UTC (nếu nó là UTC) sang giờ địa phương Việt Nam
        DateTime localDateTime;
        if (value.Kind == DateTimeKind.Utc)
            localDateTime = value.ToVietnamLocalTime(); // Sử dụng hàm bạn đã định nghĩa
        else if (value.Kind == DateTimeKind.Unspecified)
            // Nếu không xác định, coi nó là UTC (hoặc dựa vào quy tắc của bạn)
            // và sau đó chuyển đổi
            localDateTime = DateTime.SpecifyKind(value, DateTimeKind.Utc).ToVietnamLocalTime();
        else // DateTimeKind.Local
            // Nếu nó đã là Local (ví dụ: DateTime.Now), giả định nó đã đúng múi giờ
            // và không cần chuyển đổi thêm, chỉ cần định dạng
            localDateTime = value;

        // Bước 2: Ghi ra chuỗi với định dạng mong muốn
        writer.WriteStringValue(localDateTime.ToString("yyyy-MM-dd HH:mm:ss"));
    }
}