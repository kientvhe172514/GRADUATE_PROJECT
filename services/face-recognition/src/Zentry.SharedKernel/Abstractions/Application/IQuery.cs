using MediatR;

namespace Zentry.SharedKernel.Abstractions.Application;

public interface IQuery<out TResponse> : IRequest<TResponse>
    where TResponse : notnull
{
}