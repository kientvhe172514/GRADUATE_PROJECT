using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Constants.Schedule;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Schedules.CreateSchedule;

public class CreateScheduleRequestValidator : BaseValidator<CreateScheduleRequest>
{
    public CreateScheduleRequestValidator()
    {
        // Kiểm tra ClassSectionId không rỗng
        RuleFor(x => x.ClassSectionId)
            .NotEmpty()
            .WithMessage("ID của lớp học phần là bắt buộc và không được rỗng.");

        // Kiểm tra RoomId không rỗng
        RuleFor(x => x.RoomId)
            .NotEmpty()
            .WithMessage("ID của phòng học là bắt buộc và không được rỗng.");

        RuleFor(x => x.StartDate)
            .NotEmpty()
            .WithMessage("Ngày bắt đầu không được để trống.")
            .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Now))
            .WithMessage("Ngày bắt đầu phải lớn hơn hoặc bằng ngày hiện tại.");

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("Giờ bắt đầu không được để trống.");

        When(x => x.StartDate == DateOnly.FromDateTime(DateTime.Now), () =>
        {
            RuleFor(x => x.StartTime)
                .GreaterThanOrEqualTo(TimeOnly.FromDateTime(DateTime.Now))
                .WithMessage("Giờ bắt đầu phải lớn hơn hoặc bằng giờ hiện tại.");
        });

        // Kiểm tra StartDate phải trước hoặc bằng EndDate
        RuleFor(x => x.EndDate)
            .NotEmpty()
            .WithMessage("Ngày kết thúc không được để trống ")
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");

        // Kiểm tra StartTime phải trước EndTime
        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("Giờ kết thúc không được để trống ")
            .GreaterThan(x => x.StartTime)
            .WithMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");

        // Kiểm tra WeekDay phải là một giá trị hợp lệ từ Enum
        RuleFor(x => x.WeekDay)
            .NotEmpty()
            .WithMessage("Thứ trong tuần là bắt buộc.")
            .Must(BeAValidWeekDay)
            .WithMessage("Thứ trong tuần không hợp lệ. Vui lòng nhập một giá trị hợp lệ (ví dụ: 'Monday', 'Tuesday').");
    }

    private static bool BeAValidWeekDay(string weekDay)
    {
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