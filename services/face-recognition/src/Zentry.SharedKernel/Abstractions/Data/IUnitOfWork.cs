namespace Zentry.SharedKernel.Abstractions.Data;

public interface IUnitOfWork
{
    Task<int> CommitAsync(CancellationToken cancellationToken);
}