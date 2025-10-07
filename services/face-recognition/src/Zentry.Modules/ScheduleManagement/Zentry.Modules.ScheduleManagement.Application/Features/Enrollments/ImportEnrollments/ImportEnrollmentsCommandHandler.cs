using MassTransit;
using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.ScheduleManagement.Application.Abstractions;
using Zentry.Modules.ScheduleManagement.Application.Dtos;
using Zentry.Modules.ScheduleManagement.Domain.Entities;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.ScheduleManagement.Application.Features.Enrollments.ImportEnrollments;

public class ImportEnrollmentsCommandHandler(
    IClassSectionRepository classSectionRepository,
    IEnrollmentRepository enrollmentRepository,
    IMediator mediator,
    IPublishEndpoint publishEndpoint,
    ILogger<ImportEnrollmentsCommandHandler> logger)
    : ICommandHandler<ImportEnrollmentsCommand, ImportEnrollmentsResponse>
{
    public async Task<ImportEnrollmentsResponse> Handle(ImportEnrollmentsCommand command,
        CancellationToken cancellationToken)
    {
        var response = new ImportEnrollmentsResponse();
        var validEnrollmentsToProcess = new List<EnrollmentImportDto>();
        var finalEnrollments = new List<Enrollment>();

        var validator = new ImportEnrollmentDtoValidator();
        foreach (var enrollmentDto in command.EnrollmentsToImport)
        {
            var validationResult = await validator.ValidateAsync(enrollmentDto, cancellationToken);
            if (validationResult.IsValid)
            {
                validEnrollmentsToProcess.Add(enrollmentDto);
            }
            else
            {
                var errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
                response.Errors.Add(new ImportError
                {
                    RowIndex = enrollmentDto.RowIndex,
                    Identifier = $"{enrollmentDto.StudentCode} - {enrollmentDto.ClassSectionCode}",
                    Message = errorMessage
                });
            }
        }

        if (!validEnrollmentsToProcess.Any())
        {
            response.FailedCount = command.EnrollmentsToImport.Count;
            return response;
        }

        // 2. Lấy tất cả StudentCode và ClassSectionCode duy nhất để truy vấn hiệu quả
        var studentCodes = validEnrollmentsToProcess.Select(e => e.StudentCode).Distinct().ToList();
        var classSectionCodes = validEnrollmentsToProcess.Select(e => e.ClassSectionCode).Distinct().ToList();

        // 3. Sử dụng Integration Query để lấy thông tin Student và ClassSection
        var getStudentsQuery = new GetUsersByStudentCodesIntegrationQuery(studentCodes);
        var studentsResponse = await mediator.Send(getStudentsQuery, cancellationToken);
        var students = studentsResponse.StudentCodeToUserIdMap; // Lấy dictionary từ response

        var classSections = (await classSectionRepository.GetBySectionCodesAsync(classSectionCodes, cancellationToken))
            .ToDictionary(cs => cs.SectionCode, cs => cs.Id, StringComparer.OrdinalIgnoreCase);

        // 4. Xử lý từng dòng dữ liệu hợp lệ
        foreach (var enrollmentDto in validEnrollmentsToProcess)
            try
            {
                // Tìm StudentId và ClassSectionId
                if (!students.TryGetValue(enrollmentDto.StudentCode, out var studentId))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = enrollmentDto.RowIndex,
                        Identifier = enrollmentDto.StudentCode,
                        Message = $"Mã số sinh viên '{enrollmentDto.StudentCode}' không tồn tại."
                    });
                    continue;
                }

                if (!classSections.TryGetValue(enrollmentDto.ClassSectionCode, out var classSectionId))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = enrollmentDto.RowIndex,
                        Identifier = enrollmentDto.ClassSectionCode,
                        Message = $"Mã lớp học '{enrollmentDto.ClassSectionCode}' không tồn tại."
                    });
                    continue;
                }

                // Kiểm tra xem đã đăng ký chưa
                var isAlreadyEnrolled =
                    await enrollmentRepository.IsEnrolledAsync(studentId, classSectionId, cancellationToken);
                if (isAlreadyEnrolled)
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = enrollmentDto.RowIndex,
                        Identifier = $"{enrollmentDto.StudentCode} - {enrollmentDto.ClassSectionCode}",
                        Message =
                            $"Sinh viên '{enrollmentDto.StudentCode}' đã được đăng ký vào lớp '{enrollmentDto.ClassSectionCode}'."
                    });
                    continue;
                }

                finalEnrollments.Add(Enrollment.Create(studentId, classSectionId));
            }
            catch (Exception ex)
            {
                response.Errors.Add(new ImportError
                {
                    RowIndex = enrollmentDto.RowIndex,
                    Identifier = $"{enrollmentDto.StudentCode} - {enrollmentDto.ClassSectionCode}",
                    Message = $"Lỗi khi chuẩn bị dữ liệu: {ex.Message}"
                });
            }

        // 5. Lưu vào database và publish events
        try
        {
            await enrollmentRepository.AddRangeAsync(finalEnrollments, cancellationToken);
            await enrollmentRepository.SaveChangesAsync(cancellationToken);
            response.ImportedCount = finalEnrollments.Count;
            response.FailedCount = command.EnrollmentsToImport.Count - response.ImportedCount;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save imported enrollments to database.");
            response.Errors.Add(new ImportError
            {
                RowIndex = 0,
                Identifier = string.Empty,
                Message = $"Lỗi khi lưu vào CSDL: {ex.Message}"
            });
            response.ImportedCount = 0;
            response.FailedCount = command.EnrollmentsToImport.Count;
        }

        return response;
    }
}