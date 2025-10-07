using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.RemoveStudentFromClassSection;

public class RemoveStudentFromClassSectionValidator : BaseValidator<RemoveStudentFromClassSectionRequest>
{
    public RemoveStudentFromClassSectionValidator()
    {
        RuleFor(x => x.ClassSectionId)
            .NotEmpty()
            .WithMessage("ClassSection Id là bắt buộc.");
        RuleFor(x => x.StudentId)
            .NotEmpty()
            .WithMessage("Student Id là bắt buộc.");
    }
}