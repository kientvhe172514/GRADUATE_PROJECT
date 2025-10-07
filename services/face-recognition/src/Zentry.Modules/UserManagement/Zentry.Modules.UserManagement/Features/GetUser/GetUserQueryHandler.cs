using MediatR;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Exceptions;

namespace Zentry.Modules.UserManagement.Features.GetUser;

public class GetUserQueryHandler(IUserRepository userRepository, IMediator mediator)
    : IQueryHandler<GetUserQuery, GetUserResponse>
{
    private const string StudentCodeKey = "StudentCode";
    private const string EmployeeCodeKey = "EmployeeCode";

    public async Task<GetUserResponse> Handle(GetUserQuery query, CancellationToken cancellationToken)
    {
        // Lấy thông tin user trước
        var user = await userRepository.GetByIdAsync(query.UserId, cancellationToken);
        if (user is null) throw new ResourceNotFoundException(nameof(User), query.UserId);

        // Sau đó lấy account
        var account = await userRepository.GetAccountByUserId(query.UserId);

        // Kiểm tra user tồn tại
        if (user is null) throw new ResourceNotFoundException(nameof(User), query.UserId);

        // Kiểm tra account tồn tại
        if (account is null) throw new ResourceNotFoundException("Account", query.UserId);

        // Lấy attributes của user
        var getAttributesQuery = new GetUserAttributesIntegrationQuery(user.Id);
        var attributesResponse = await mediator.Send(getAttributesQuery, cancellationToken);

        // Lấy user code (ưu tiên StudentCode trước)
        var userCode = GetUserCode(attributesResponse.Attributes);

        var response = new GetUserResponse
        {
            UserId = user.Id,
            AccountId = account.Id,
            Code = userCode,
            Email = account.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Role = account.Role.ToString(),
            Status = account.Status.ToString(),
            CreatedAt = account.CreatedAt,
            HasFaceId = user.HasFaceId,
            FaceIdLastUpdated = user.FaceIdLastUpdated
        };

        return response;
    }

    private static string GetUserCode(Dictionary<string, string> attributes)
    {
        if (attributes.TryGetValue(StudentCodeKey, out var studentCode) &&
            !string.IsNullOrEmpty(studentCode))
            return studentCode;

        if (attributes.TryGetValue(EmployeeCodeKey, out var employeeCode) &&
            !string.IsNullOrEmpty(employeeCode))
            return employeeCode;

        return string.Empty;
    }
}