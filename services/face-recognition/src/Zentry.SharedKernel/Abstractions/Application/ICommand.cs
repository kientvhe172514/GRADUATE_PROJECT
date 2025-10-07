using MediatR;

namespace Zentry.SharedKernel.Abstractions.Application;

public interface ICommand : ICommand<Unit>
{
}

public interface ICommand<out TResponse> : IRequest<TResponse>
{
}