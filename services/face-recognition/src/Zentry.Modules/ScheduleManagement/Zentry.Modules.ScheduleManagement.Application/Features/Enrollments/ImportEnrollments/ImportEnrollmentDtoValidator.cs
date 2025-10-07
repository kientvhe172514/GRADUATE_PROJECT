using FluentValidation;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.ImportEnrollments;

public class ImportEnrollmentDtoValidator : BaseValidator<EnrollmentImportDto>
{
    public ImportEnrollmentDtoValidator()
    {
        RuleFor(x => x.StudentCode)
            .NotEmpty().WithMessage("Mã số sinh viên không được để trống.");

        RuleFor(x => x.ClassSectionCode)
            .NotEmpty().WithMessage("Mã lớp học không được để trống.");
    }
}