using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.ClassSections.CreateClassSection;

public class CreateClassSectionRequestValidator : BaseValidator<CreateClassSectionRequest>
{
    public CreateClassSectionRequestValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty()
            .WithMessage("Course ID là bắt buộc.")
            .NotEqual(Guid.Empty) // Thêm quy tắc này
            .WithMessage("Course ID không được là giá trị rỗng.");


        RuleFor(x => x.SectionCode)
            .NotEmpty().WithMessage("Section Code là bắt buộc.")
            .MaximumLength(50).WithMessage("Section Code tối đa 50 kí tự.");

        RuleFor(x => x.Semester)
            .NotEmpty().WithMessage("Semester là bắt buộc.")
            .Matches("^(SP|SU|FA)\\d{2}$")
            .WithMessage("Định dạng học kỳ không hợp lệ. Ví dụ: SP25, SU25.");
    }
}