using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.EnrollStudent;

public class EnrollStudentRequestValidator : BaseValidator<EnrollStudentRequest>
{
    public EnrollStudentRequestValidator()
    {
        RuleFor(x => x.ClassSectionId)
            .NotEmpty()
            .WithMessage("ClassSection Id là bắt buộc.");
        RuleFor(x => x.StudentId)
            .NotEmpty()
            .WithMessage("Student Id là bắt buộc.");
    }
}