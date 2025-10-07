using Zentry.SharedKernel.Common;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Domain.ValueObjects;

public class Semester : ValueObject
{
    private Semester(string value)
    {
        Value = value;
    }

    public string Value { get; }

    public static Semester Create(string semesterString)
    {
        Guard.AgainstNullOrEmpty(semesterString, nameof(semesterString));

        if (semesterString.Length != 4)
            throw new ArgumentException("Invalid semester format. Expected format is '[SP|SU|FA]YY'.");

        var code = semesterString[..2].ToUpper();
        if (code is not "SP" and not "SU" and not "FA")
            throw new ArgumentException("Invalid semester code. Expected 'SP', 'SU', or 'FA'.");

        if (!int.TryParse(semesterString[2..], out var year) || year < 0)
            throw new ArgumentException("Invalid year format in semester string.");

        return new Semester(semesterString);
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }

    public override string ToString()
    {
        return Value;
    }

    public static implicit operator string(Semester semester)
    {
        return semester.Value;
    }
}