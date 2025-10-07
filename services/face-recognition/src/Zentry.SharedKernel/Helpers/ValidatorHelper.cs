using System.Text.RegularExpressions;

namespace Zentry.SharedKernel.Helpers;

public class ValidatorHelper
{
    public static bool ContainsInvalidCharacters(string? input)
    {
        if (string.IsNullOrEmpty(input)) return false;

        var regex = new Regex(@"[^a-zA-Z0-9\s\p{L}]"); // \p{L} bao gồm các ký tự Unicode (tiếng Việt có dấu)
        return regex.IsMatch(input);
    }
}