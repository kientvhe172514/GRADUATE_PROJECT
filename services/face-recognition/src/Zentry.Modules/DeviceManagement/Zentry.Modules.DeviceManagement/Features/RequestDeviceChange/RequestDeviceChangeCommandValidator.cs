using FluentValidation;
using Zentry.Modules.DeviceManagement.ValueObjects;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.DeviceManagement.Features.RequestDeviceChange;

public class RequestDeviceChangeCommandValidator : BaseValidator<RequestDeviceChangeCommand>
{
    public RequestDeviceChangeCommandValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty()
            .WithMessage("ID người dùng là bắt buộc.");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Lý do thay đổi là bắt buộc.")
            .MaximumLength(500)
            .WithMessage("Lý do thay đổi không được vượt quá 500 ký tự.");

        RuleFor(x => x.DeviceName)
            .NotEmpty()
            .WithMessage("Tên thiết bị là bắt buộc.")
            .MaximumLength(100)
            .WithMessage("Tên thiết bị không được vượt quá 100 ký tự.");

        RuleFor(x => x.AndroidId)
            .NotEmpty()
            .WithMessage("Android ID của thiết bị mới là bắt buộc.")
            .Must(androidId =>
                !string.IsNullOrEmpty(androidId) && AndroidId.Create(androidId) != null)
            .WithMessage("Android ID không hợp lệ. Vui lòng kiểm tra định dạng.");

        RuleFor(x => x.Platform)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.Platform))
            .WithMessage("Nền tảng không được vượt quá 50 ký tự.");

        RuleFor(x => x.OsVersion)
            .MaximumLength(50)
            .When(x => !string.IsNullOrEmpty(x.OsVersion))
            .WithMessage("Phiên bản hệ điều hành không được vượt quá 50 ký tự.");

        RuleFor(x => x.Model)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Model))
            .WithMessage("Mẫu thiết bị không được vượt quá 100 ký tự.");

        RuleFor(x => x.Manufacturer)
            .MaximumLength(100)
            .When(x => !string.IsNullOrEmpty(x.Manufacturer))
            .WithMessage("Nhà sản xuất không được vượt quá 100 ký tự.");

        RuleFor(x => x.AppVersion)
            .MaximumLength(20)
            .When(x => !string.IsNullOrEmpty(x.AppVersion))
            .WithMessage("Phiên bản ứng dụng không được vượt quá 20 ký tự.");
    }
}