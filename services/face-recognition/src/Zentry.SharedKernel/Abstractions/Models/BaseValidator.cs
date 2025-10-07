using System.Linq.Expressions;
using FluentValidation;

namespace Zentry.SharedKernel.Abstractions.Models;

public abstract class BaseValidator<T> : AbstractValidator<T>
{
    protected void RuleForRequired(Expression<Func<T, string>> expression, string fieldName)
    {
        RuleFor(expression)
            .NotEmpty()
            .WithMessage($"{fieldName} là bắt buộc");
    }

    protected void RuleForGuid(Expression<Func<T, Guid>> expression, string fieldName)
    {
        RuleFor(expression)
            .NotEqual(Guid.Empty)
            .WithMessage($"{fieldName} không được để trống");
    }

    protected void RuleForStringLength(Expression<Func<T, string>> expression, string fieldName, int maxLength)
    {
        RuleFor(expression)
            .NotEmpty()
            .WithMessage($"{fieldName} là bắt buộc")
            .MaximumLength(maxLength)
            .WithMessage($"{fieldName} không được vượt quá {maxLength} ký tự");
    }
}