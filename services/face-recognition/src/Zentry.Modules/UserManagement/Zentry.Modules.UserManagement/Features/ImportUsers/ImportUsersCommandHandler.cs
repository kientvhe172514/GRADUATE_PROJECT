using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Configuration;

namespace Zentry.Modules.UserManagement.Features.ImportUsers;

public class ImportUsersCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IMediator mediator,
    ILogger<ImportUsersCommandHandler> logger)
    : ICommandHandler<ImportUsersCommand, ImportUsersResponse>
{
    public async Task<ImportUsersResponse> Handle(ImportUsersCommand command, CancellationToken cancellationToken)
    {
        var response = new ImportUsersResponse();
        var validUsers = new List<UserImportDto>();

        var usersToProcess = command.UsersToImport.Where(u => !string.IsNullOrWhiteSpace(u.Email)).ToList();

        // 1. Validate users
        foreach (var userDto in usersToProcess)
        {
            var validator = new UserImportDtoValidator();
            var validationResult = await validator.ValidateAsync(userDto, cancellationToken);

            if (validationResult.IsValid)
            {
                validUsers.Add(userDto);
            }
            else
            {
                var errorMessage = string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage));
                response.Errors.Add(new ImportError
                {
                    RowIndex = userDto.RowIndex,
                    Email = userDto.Email,
                    Message = errorMessage
                });
            }
        }

        if (validUsers.Count == 0)
        {
            response.FailedCount = usersToProcess.Count;
            return response;
        }

        // 2. Check for existing emails and duplicates
        var existingEmails = await userRepository.GetExistingEmailsAsync(validUsers.Select(u => u.Email).ToList());
        var duplicateEmailsInInput = validUsers
            .GroupBy(u => u.Email, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        var finalUsersToProcess = new List<UserImportDto>();
        foreach (var userDto in validUsers)
        {
            if (existingEmails.Contains(userDto.Email, StringComparer.OrdinalIgnoreCase))
            {
                response.Errors.Add(new ImportError
                {
                    RowIndex = userDto.RowIndex,
                    Email = userDto.Email,
                    Message = $"Email '{userDto.Email}' đã tồn tại trong hệ thống."
                });
            }
            else if (duplicateEmailsInInput.Contains(userDto.Email, StringComparer.OrdinalIgnoreCase))
            {
                if (!response.Errors.Any(e => e.Email.Equals(userDto.Email, StringComparison.OrdinalIgnoreCase)))
                {
                    response.Errors.Add(new ImportError
                    {
                        RowIndex = userDto.RowIndex,
                        Email = userDto.Email,
                        Message = $"Email '{userDto.Email}' bị trùng lặp trong file import."
                    });
                }
            }
            else
            {
                finalUsersToProcess.Add(userDto);
            }
        }

        var accountsToCreate = new List<Account>();
        var usersToCreate = new List<User>();
        var userAttributesMap = new Dictionary<Guid, Dictionary<string, string>>();

        foreach (var userDto in finalUsersToProcess)
        {
            try
            {
                var role = Role.FromName(userDto.Role);
                var (hashedPassword, salt) = passwordHasher.HashPassword(userDto.Password);

                var account = Account.Create(userDto.Email, hashedPassword, salt, role);
                var user = User.Create(account.Id, userDto.FullName, userDto.PhoneNumber);

                accountsToCreate.Add(account);
                usersToCreate.Add(user);

                // Prepare user attributes based on role
                var userAttributes = new Dictionary<string, string>();

                // Attributes sẽ được generate tự động dựa trên role, không đọc từ CSV

                // Generate role-specific codes
                if (Equals(account.Role, Role.Student))
                {
                    var studentCode = GenerateUniqueStudentCode();
                    userAttributes["StudentCode"] = studentCode;
                }
                else if (Equals(account.Role, Role.Lecturer))
                {
                    var lecturerCode = GenerateUniqueLecturerCode();
                    userAttributes["EmployeeCode"] = lecturerCode;
                }

                if (userAttributes.Count > 0)
                {
                    userAttributesMap[user.Id] = userAttributes;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to prepare user data for import: {Email}", userDto.Email);
                response.Errors.Add(new ImportError
                {
                    RowIndex = userDto.RowIndex,
                    Email = userDto.Email,
                    Message = $"Lỗi khi chuẩn bị dữ liệu: {ex.Message}"
                });
            }
        }

        try
        {
            await userRepository.AddRangeAsync(accountsToCreate, usersToCreate, cancellationToken);
            response.ImportedCount = accountsToCreate.Count;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to save imported users to database.");
            response.Errors.Add(new ImportError
            {
                RowIndex = 0,
                Email = string.Empty,
                Message = $"Lỗi khi lưu vào CSDL: {ex.Message}"
            });
            response.ImportedCount = 0;
            response.FailedCount = command.UsersToImport.Count;
            return response;
        }

        // 5. Bulk create user attributes
        if (userAttributesMap.Count > 0)
        {
            try
            {
                var bulkCreateAttributesCommand = new BulkCreateUserAttributesIntegrationCommand(userAttributesMap);
                var attributesResponse = await mediator.Send(bulkCreateAttributesCommand, cancellationToken);

                if (!attributesResponse.Success)
                {
                    logger.LogWarning("Failed to create some user attributes during import: {Message}",
                        attributesResponse.Message);
                }
                else
                {
                    logger.LogInformation("Successfully created attributes for {Count} users during import",
                        attributesResponse.TotalSuccessful);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to create user attributes during import");
            }
        }

        response.FailedCount = command.UsersToImport.Count - response.ImportedCount;
        return response;
    }

    private string GenerateUniqueStudentCode()
    {
        return $"STU{new Random().Next(10000, 99999)}";
    }

    private string GenerateUniqueLecturerCode()
    {
        return $"EMP{new Random().Next(1000, 9999)}";
    }
}
