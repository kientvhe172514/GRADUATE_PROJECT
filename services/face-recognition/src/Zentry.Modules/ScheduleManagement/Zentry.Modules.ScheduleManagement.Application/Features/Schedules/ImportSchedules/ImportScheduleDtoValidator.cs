using FluentValidation;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Schedule;
using Zentry.SharedKernel.Domain;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.ImportSchedules;

public class ImportScheduleDtoValidator : BaseValidator<ScheduleImportDto>
{
    public ImportScheduleDtoValidator()
    {
        RuleFor(x => x.SectionCode)
            .NotEmpty().WithMessage("Mã lớp không được để trống.");

        RuleFor(x => x.RoomName)
            .NotEmpty().WithMessage("Tên phòng học không được để trống.");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.")
            .Must(BeAValidDate).WithMessage("Ngày bắt đầu không đúng định dạng 'yyyy-MM-dd'.");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("Ngày kết thúc không được để trống.")
            .Must(BeAValidDate).WithMessage("Ngày kết thúc không đúng định dạng 'yyyy-MM-dd'.");

        RuleFor(x => x.StartTime)
            .NotEmpty().WithMessage("Thời gian bắt đầu không được để trống.")
            .Must(BeAValidTime).WithMessage("Thời gian bắt đầu không đúng định dạng 'HH:mm'.");

        RuleFor(x => x.EndTime)
            .NotEmpty().WithMessage("Thời gian kết thúc không được để trống.")
            .Must(BeAValidTime).WithMessage("Thời gian kết thúc không đúng định dạng 'HH:mm'.")
            .Must((dto, endTime) => IsEndTimeAfterStartTime(dto.StartTime, endTime))
            .WithMessage("Thời gian kết thúc phải sau thời gian bắt đầu.");

        RuleFor(x => x.WeekDay)
            .NotEmpty().WithMessage("Thứ trong tuần không được để trống.")
            .Must(weekDay => Enumeration.GetAll<WeekDayEnum>()
                .Any(w => w.ToString().Equals(weekDay, StringComparison.OrdinalIgnoreCase)))
            .WithMessage("Thứ trong tuần không hợp lệ. Vui lòng nhập: Monday, Tuesday,...");
    }

    private bool BeAValidDate(string dateString)
    {
        return DateOnly.TryParse(dateString, out _);
    }

    private bool BeAValidTime(string timeString)
    {
        return TimeOnly.TryParse(timeString, out _);
    }

    private bool IsEndTimeAfterStartTime(string startTime, string endTime)
    {
        if (TimeOnly.TryParse(startTime, out var start) && TimeOnly.TryParse(endTime, out var end)) return end > start;

        return true; // Bỏ qua lỗi nếu định dạng thời gian không hợp lệ, vì đã có Rule ở trên.
    }
}