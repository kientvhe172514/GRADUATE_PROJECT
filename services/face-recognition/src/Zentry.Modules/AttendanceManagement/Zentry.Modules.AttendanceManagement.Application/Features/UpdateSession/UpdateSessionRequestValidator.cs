using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.AttendanceManagement.Application.Features.UpdateSession;

public class UpdateSessionRequestValidator : BaseValidator<UpdateSessionRequest>
{
    public UpdateSessionRequestValidator()
    {
        RuleFor(x => x)
            .Must(x => x.LecturerId.HasValue || x is { StartTime: not null, EndTime: not null } ||
                       (x.SessionConfigs != null && x.SessionConfigs.Count != 0))
            .WithMessage(
                "Ít nhất một trong các trường LecturerId, StartTime, EndTime, hoặc SessionConfigs phải có giá trị.");

        RuleFor(x => x.StartTime)
            .NotEmpty()
            .WithMessage("Giờ bắt đầu không được để trống khi bạn muốn cập nhật nó.")
            .When(x => x.StartTime.HasValue);

        RuleFor(x => x.EndTime)
            .NotEmpty()
            .WithMessage("Giờ kết thúc không được để trống khi bạn muốn cập nhật nó.")
            .When(x => x.EndTime.HasValue);

        When(x => x.StartTime.HasValue && x.EndTime.HasValue, () =>
        {
            RuleFor(x => x.EndTime)
                .GreaterThan(x => x.StartTime!.Value)
                .WithMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
        });

        RuleFor(x => x.LecturerId)
            .NotEmpty()
            .WithMessage("ID của giảng viên không được rỗng.")
            .When(x => x.LecturerId.HasValue);

        RuleFor(x => x.SessionConfigs)
            .Must(configs => configs != null && configs.Count != 0)
            .WithMessage("Cấu hình session không được rỗng khi được cung cấp.")
            .When(x => x.SessionConfigs != null);
    }
}