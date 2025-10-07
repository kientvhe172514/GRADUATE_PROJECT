using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Http;
using OfficeOpenXml;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.SharedKernel.Abstractions.Data;

public class GenericFileProcessor<T> : IFileProcessor<T> where T : BaseImportDto, new()
{
    private readonly CsvConfiguration _csvConfig = new(CultureInfo.InvariantCulture)
    {
        PrepareHeaderForMatch = args => args.Header.ToLower().Replace(" ", "")
    };

    protected virtual string[] RequiredHeaders => [];

    protected virtual ClassMap<T>? CsvClassMap => null;

    public async Task<List<T>> ProcessFileAsync(IFormFile file, CancellationToken cancellationToken)
    {
        var fileExtension = Path.GetExtension(file.FileName).ToLower();

        await using var stream = file.OpenReadStream();

        return fileExtension switch
        {
            ".csv" => await ProcessCsvAsync(stream, cancellationToken),
            ".xlsx" or ".xls" => await ProcessExcelAsync(stream, cancellationToken),
            _ => throw new InvalidFileFormatException("Unsupported file format. Please upload a CSV or Excel file.")
        };
    }

    private async Task<List<T>> ProcessCsvAsync(Stream stream, CancellationToken cancellationToken)
    {
        var records = new List<T>();
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, _csvConfig);

        if (CsvClassMap != null) csv.Context.RegisterClassMap(CsvClassMap);

        var csvRecords = csv.GetRecordsAsync<T>(cancellationToken);
        var rowIndex = 1;

        await foreach (var record in csvRecords)
        {
            record.RowIndex = rowIndex + 1;
            records.Add(record);
            rowIndex++;
        }

        return records;
    }

    private Task<List<T>> ProcessExcelAsync(Stream stream, CancellationToken cancellationToken)
    {
        var records = new List<T>();
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();
        if (worksheet == null) return Task.FromResult(records);

        var rowCount = worksheet.Dimension.Rows;
        if (rowCount <= 1) return Task.FromResult(records);

        var headerMap = new Dictionary<string, int>();
        for (var col = 1; col <= worksheet.Dimension.Columns; col++)
        {
            var header = worksheet.Cells[1, col].Text.ToLower().Replace(" ", "");
            headerMap[header] = col;
        }

        foreach (var header in RequiredHeaders)
            if (!headerMap.ContainsKey(header))
                throw new InvalidFileFormatException($"Excel file is missing a required column: '{header}'");

        var properties = typeof(T).GetProperties();

        for (var row = 2; row <= rowCount; row++)
        {
            var record = new T();
            record.RowIndex = row;

            foreach (var prop in properties)
            {
                var columnName = prop.Name.ToLower().Replace(" ", "");
                if (headerMap.TryGetValue(columnName, out var colIndex))
                {
                    var cellValue = worksheet.Cells[row, colIndex].Text;
                    try
                    {
                        var convertedValue = Convert.ChangeType(cellValue, prop.PropertyType);
                        prop.SetValue(record, convertedValue);
                    }
                    catch
                    {
                        // Bỏ qua lỗi chuyển đổi hoặc ghi log
                    }
                }
            }

            records.Add(record);
        }

        return Task.FromResult(records);
    }
}