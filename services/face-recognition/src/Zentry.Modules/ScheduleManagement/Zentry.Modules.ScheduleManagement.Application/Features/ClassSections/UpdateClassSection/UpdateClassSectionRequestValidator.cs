using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.UpdateClassSection;

public class UpdateClassSectionRequestValidator : BaseValidator<UpdateClassSectionRequest>
{
    public UpdateClassSectionRequestValidator()
    {
        RuleFor(x => x.SectionCode)
            .NotEmpty().WithMessage("Section Code là bắt buộc.")
            .MaximumLength(50).WithMessage("Section Code tối đa 50 kí tự.");

        RuleFor(x => x.Semester)
            .NotEmpty().WithMessage("Semester là bắt buộc.")
            .Matches("^(SP|SU|FA)\\d{2}$")
            .WithMessage("Định dạng học kỳ không hợp lệ. Ví dụ: SP25, SU25.");
    }
}