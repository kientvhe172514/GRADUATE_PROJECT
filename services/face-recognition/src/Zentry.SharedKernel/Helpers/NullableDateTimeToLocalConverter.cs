using System.Text.Json;
using System.Text.Json.Serialization;

namespace Zentry.SharedKernel.Helpers;

public class NullableDateTimeToLocalConverter : JsonConverter<DateTime?>
{
    private readonly DateTimeToLocalConverter _baseConverter = new();

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null) return null;

        return _baseConverter.Read(ref reader, typeof(DateTime), options);
    }

    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
    {
        if (!value.HasValue)
            writer.WriteNullValue();
        else
            _baseConverter.Write(writer, value.Value, options);
    }
}