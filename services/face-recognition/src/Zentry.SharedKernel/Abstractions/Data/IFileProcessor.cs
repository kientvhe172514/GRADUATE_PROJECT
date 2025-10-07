using Microsoft.AspNetCore.Http;

namespace Zentry.SharedKernel.Abstractions.Data;

/// <summary>
///     A generic service for processing uploaded files (CSV, Excel) into a list of DTOs.
/// </summary>
/// <typeparam name="T">The type of DTO to be created from the file content.</typeparam>
public interface IFileProcessor<T> where T : BaseImportDto, new()
{
    /// <summary>
    ///     Processes an uploaded file and converts its content into a list of DTOs.
    /// </summary>
    /// <param name="file">The uploaded file.</param>
    /// <param name="cancellationToken">A cancellation token.</param>
    /// <returns>A list of DTOs populated with data from the file.</returns>
    Task<List<T>> ProcessFileAsync(IFormFile file, CancellationToken cancellationToken);
}

/// <summary>
///     Base class for DTOs used in file import operations.
///     Includes properties common to all imported records.
/// </summary>
public abstract class BaseImportDto
{
    public int RowIndex { get; set; }
}