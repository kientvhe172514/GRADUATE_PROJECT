using System.Globalization;
using System.Text.Json;

namespace Zentry.Modules.AttendanceManagement.Domain.ValueObjects;

public record SessionConfigSnapshot
{
    private readonly Dictionary<string, string> _configs;

    public SessionConfigSnapshot() : this(new Dictionary<string, string>())
    {
    }

    public SessionConfigSnapshot(Dictionary<string, string> configs)
    {
        _configs = configs;
    }

    // Indexer để truy cập config dễ dàng
    public string? this[string key]
    {
        get => _configs.GetValueOrDefault(key);
        set
        {
            if (value == null)
                _configs.Remove(key);
            else
                _configs[key] = value;
        }
    }

    // Các property shortcuts cho các config thông dụng (backward compatibility)
    public int AttendanceWindowMinutes
    {
        get => GetInt("AttendanceWindowMinutes", 15);
        set => SetInt("AttendanceWindowMinutes", value);
    }


    public int TotalAttendanceRounds
    {
        get => GetInt("TotalAttendanceRounds", 4);
        set => SetInt("TotalAttendanceRounds", value);
    }

    public int AbsentReportGracePeriodHours
    {
        get => GetInt("AbsentReportGracePeriodHours", 24);
        set => SetInt("AbsentReportGracePeriodHours", value);
    }

    public int ManualAdjustmentGracePeriodHours
    {
        get => GetInt("ManualAdjustmentGracePeriodHours", 24);
        set => SetInt("ManualAdjustmentGracePeriodHours", value);
    }

    public string CourseCode
    {
        get => GetString("courseCode", "Unknown");
        set => SetString("courseCode", value);
    }

    public string SectionCode
    {
        get => GetString("sectionCode", "Unknown");
        set => SetString("sectionCode", value);
    }

    public IEnumerable<string> Keys => _configs.Keys;

    public IEnumerable<string> Values => _configs.Values;

    public int Count => _configs.Count;

    // Các helper methods để get/set config với type safety
    public int GetInt(string key, int defaultValue = 0)
    {
        if (_configs.TryGetValue(key, out var value) && int.TryParse(value, out var result))
            return result;
        return defaultValue;
    }

    public void SetInt(string key, int value)
    {
        _configs[key] = value.ToString();
    }

    public double GetDouble(string key, double defaultValue = 0.0)
    {
        if (_configs.TryGetValue(key, out var value) && double.TryParse(value, out var result))
            return result;
        return defaultValue;
    }

    public void SetDouble(string key, double value)
    {
        _configs[key] = value.ToString(CultureInfo.InvariantCulture);
    }

    public bool GetBool(string key, bool defaultValue = false)
    {
        if (_configs.TryGetValue(key, out var value) && bool.TryParse(value, out var result))
            return result;
        return defaultValue;
    }

    public void SetBool(string key, bool value)
    {
        _configs[key] = value.ToString();
    }

    public string GetString(string key, string defaultValue = "")
    {
        return _configs.GetValueOrDefault(key, defaultValue);
    }

    public void SetString(string key, string value)
    {
        _configs[key] = value;
    }

    public TimeSpan GetTimeSpan(string key, TimeSpan defaultValue = default)
    {
        if (_configs.TryGetValue(key, out var value) && TimeSpan.TryParse(value, out var result))
            return result;
        return defaultValue;
    }

    public void SetTimeSpan(string key, TimeSpan value)
    {
        _configs[key] = value.ToString();
    }

    // Methods để làm việc với dictionary
    public bool ContainsKey(string key)
    {
        return _configs.ContainsKey(key);
    }

    // Merge configs từ dictionary khác
    public SessionConfigSnapshot Merge(Dictionary<string, string> additionalConfigs)
    {
        var merged =
            new Dictionary<string, string>(_configs, StringComparer.OrdinalIgnoreCase);
        foreach (var kvp in additionalConfigs) merged[kvp.Key] = kvp.Value;

        return new SessionConfigSnapshot(merged);
    }

    // Convert to dictionary (for serialization)
    public Dictionary<string, string> ToDictionary()
    {
        return new Dictionary<string, string>(_configs);
    }

    // Static factory method từ dictionary
    public static SessionConfigSnapshot FromDictionary(Dictionary<string, string> configs)
    {
        return new SessionConfigSnapshot(configs);
    }

    // JSON serialization support
    public string ToJson()
    {
        return JsonSerializer.Serialize(_configs);
    }

    public static SessionConfigSnapshot FromJson(string json)
    {
        var configs = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>();
        return new SessionConfigSnapshot(configs);
    }

    // Override ToString for debugging
    public override string ToString()
    {
        return
            $"SessionConfigSnapshot({_configs.Count} configs): {string.Join(", ", _configs.Select(kvp => $"{kvp.Key}={kvp.Value}"))}";
    }
}