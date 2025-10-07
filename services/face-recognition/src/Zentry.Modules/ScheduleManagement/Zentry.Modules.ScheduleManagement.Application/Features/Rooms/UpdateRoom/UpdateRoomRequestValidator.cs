using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;
using Zentry.SharedKernel.Helpers;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Rooms.UpdateRoom;

public class UpdateRoomRequestValidator : BaseValidator<UpdateRoomRequest>
{
    public UpdateRoomRequestValidator()
    {
        // Rule for RoomName
        RuleFor(x => x.RoomName)
            .NotEmpty()
            .WithMessage("Tên phòng là bắt buộc.")
            .MaximumLength(100)
            .WithMessage("Tên phòng không được vượt quá 100 ký tự.");

        RuleFor(x => x.RoomName)
            .Must(name => !ValidatorHelper.ContainsInvalidCharacters(name))
            .WithMessage("Tên phòng chứa ký tự đặc biệt không hợp lệ.");

        // Rule for Building
        RuleFor(x => x.Building)
            .NotEmpty()
            .WithMessage("Tên tòa nhà là bắt buộc.")
            .MaximumLength(100)
            .WithMessage("Tên tòa nhà không được vượt quá 100 ký tự.");

        RuleFor(x => x.Building)
            .Must(building => !ValidatorHelper.ContainsInvalidCharacters(building))
            .WithMessage("Tên tòa nhà chứa ký tự đặc biệt không hợp lệ.");
    }
}