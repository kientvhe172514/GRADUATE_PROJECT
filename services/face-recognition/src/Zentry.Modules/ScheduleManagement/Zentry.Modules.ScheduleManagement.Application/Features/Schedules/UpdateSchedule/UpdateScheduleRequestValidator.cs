using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.UpdateSchedule;

public class UpdateScheduleRequestValidator : BaseValidator<UpdateScheduleRequest>
{
    public UpdateScheduleRequestValidator()
    {
        // Yêu cầu ít nhất một trường phải có giá trị
        RuleFor(x => x)
            .Must(x => x.RoomId.HasValue || x.StartDate.HasValue || x.EndDate.HasValue || x.StartTime.HasValue ||
                       x.EndTime.HasValue || !string.IsNullOrEmpty(x.WeekDay))
            .WithMessage(
                "Ít nhất một trong các trường sau phải có giá trị: RoomId, StartDate, EndDate, StartTime, EndTime, WeekDay.");

        // Các quy tắc validation cho từng trường riêng lẻ
        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("Giờ bắt đầu không được để trống khi được cung cấp.")
            .When(x => x.StartTime.HasValue);

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("Giờ kết thúc không được để trống khi được cung cấp.")
            .When(x => x.EndTime.HasValue);

        // Kiểm tra StartTime phải trước EndTime khi cả hai đều được cung cấp
        When(x => x.StartTime.HasValue && x.EndTime.HasValue, () =>
        {
            RuleFor(x => x.EndTime)
                .GreaterThan(x => x.StartTime!.Value)
                .WithMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
        });

        // Kiểm tra EndDate phải lớn hơn hoặc bằng StartDate khi cả hai đều được cung cấp
        When(x => x.StartDate.HasValue && x.EndDate.HasValue, () =>
        {
            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate!.Value)
                .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        });

        // Kiểm tra WeekDay phải là một giá trị hợp lệ từ Enum khi được cung cấp
        RuleFor(x => x.WeekDay)
            .Must(BeAValidWeekDay)
            .WithMessage("Thứ trong tuần không hợp lệ. Vui lòng nhập một giá trị hợp lệ (ví dụ: 'Monday', 'Tuesday').")
            .When(x => !string.IsNullOrEmpty(x.WeekDay));
    }

    private static bool BeAValidWeekDay(string? weekDay)
    {
        if (string.IsNullOrEmpty(weekDay)) return true;
        try
        {
            WeekDayEnum.FromName(weekDay);
            return true;
        }
        catch (InvalidOperationException)
        {
            return false;
        }
    }
}