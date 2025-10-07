using FluentValidation;
using Zentry.SharedKernel.Abstractions.Models;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Courses.CreateCourse;

public class CreateCourseCommandValidator : BaseValidator<CreateCourseCommand>
{
    public CreateCourseCommandValidator()
    {
        // Rule for Name
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Tên khóa học là bắt buộc.")
            .MaximumLength(200)
            .WithMessage("Tên khóa học không được vượt quá 200 ký tự.");

        // Rule for Code
        RuleFor(x => x.Code)
            .NotEmpty()
            .WithMessage("Mã khóa học là bắt buộc.")
            .MaximumLength(50)
            .WithMessage("Mã khóa học không được vượt quá 50 ký tự.")
            .Matches("^[a-zA-Z0-9]+$") // Chỉ cho phép chữ và số, không ký tự đặc biệt hay khoảng trắng
            .WithMessage("Mã khóa học chỉ được chứa các ký tự chữ cái (a-z, A-Z) và số (0-9).");

        // Rule for Description (Optional but good practice)
        RuleFor(x => x.Description)
            .MaximumLength(500)
            .WithMessage("Mô tả khóa học không được vượt quá 500 ký tự.");
        // .When(x => !string.IsNullOrEmpty(x.Description)) // Chỉ áp dụng nếu Description không null/empty
    }
}