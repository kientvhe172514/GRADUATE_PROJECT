using MediatR;
using Microsoft.Extensions.Logging;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Constants.User;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.CreateUser;

public class CreateUserCommandHandler(
    IUserRepository userRepository,
    IPasswordHasher passwordHasher,
    IMediator mediator,
    ILogger<CreateUserCommandHandler> logger)
    : ICommandHandler<CreateUserCommand, CreateUserResponse>
{
    public async Task<CreateUserResponse> Handle(CreateUserCommand command, CancellationToken cancellationToken)
    {
        var emailExists = await userRepository.IsExistsByEmail(null, command.Email);
        if (emailExists)
            throw new ResourceNotFoundException($"Email '{command.Email}' đã tồn tại.");

        var (hashedPassword, salt) = passwordHasher.HashPassword(command.Password);

        var account = Account.Create(command.Email, hashedPassword, salt, Role.FromName(command.Role));
        var user = User.Create(account.Id, command.FullName, command.PhoneNumber);

        await userRepository.AddAsync(account, user, cancellationToken);

        var userAttributes = new Dictionary<string, string>();
        if (command.Attributes != null)
            foreach (var attribute in command.Attributes)
                userAttributes[attribute.Key] = attribute.Value;

        if (Equals(account.Role, Role.Student))
        {
            var studentCode = await GenerateUniqueStudentCodeAsync(cancellationToken);
            userAttributes["StudentCode"] = studentCode;
        }
        else if (Equals(account.Role, Role.Lecturer))
        {
            var lecturerCode = await GenerateUniqueLecturerCodeAsync(cancellationToken);
            userAttributes["EmployeeCode"] = lecturerCode;
        }

        var createAttributesCommand = new CreateUserAttributesIntegrationCommand(
            user.Id,
            userAttributes
        );
        var integrationResponse = await mediator.Send(createAttributesCommand, cancellationToken);

        if (!integrationResponse.Success)
            throw new IntegrationException($"Failed to create user attributes: {integrationResponse.Message}");

        var getAttributesQuery = new GetUserAttributesIntegrationQuery(user.Id);
        var attributesResponse = await mediator.Send(getAttributesQuery, cancellationToken);

        return new CreateUserResponse
        {
            UserId = user.Id,
            AccountId = account.Id,
            Email = account.Email,
            FullName = user.FullName,
            Role = account.Role.ToString(),
            Status = account.Status.ToString(),
            CreatedAt = account.CreatedAt,
            Attributes = attributesResponse.Attributes,

            SkippedAttributes = integrationResponse.SkippedAttributes
        };
    }

    private Task<string> GenerateUniqueStudentCodeAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult($"STU{new Random().Next(10000, 99999)}");
    }

    private Task<string> GenerateUniqueLecturerCodeAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult($"EMP{new Random().Next(1000, 9999)}");
    }
}