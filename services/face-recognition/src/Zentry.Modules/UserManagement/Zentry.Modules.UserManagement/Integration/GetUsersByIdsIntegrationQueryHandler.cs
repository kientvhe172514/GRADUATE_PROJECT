using MediatR;
using Zentry.Modules.UserManagement.Entities;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.Configuration;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.UserManagement.Integration;

public class GetUsersByIdsIntegrationQueryHandler(IUserRepository userRepository, IMediator mediator)
    : IQueryHandler<GetUsersByIdsIntegrationQuery, GetUsersByIdsIntegrationResponse>
{
    private const string StudentCodeKey = "StudentCode";
    private const string EmployeeCodeKey = "EmployeeCode";

    public async Task<GetUsersByIdsIntegrationResponse> Handle(
        GetUsersByIdsIntegrationQuery request,
        CancellationToken cancellationToken)
    {
        // Early return nếu không có user IDs
        if (request.UserIds.Count == 0) return new GetUsersByIdsIntegrationResponse(new List<BasicUserInfoDto>());

        // Lấy thông tin users
        var users = await userRepository.GetUsersByIdsAsync(request.UserIds, cancellationToken);

        // Nếu không tìm thấy users nào, trả về empty response
        if (!users.Any()) return new GetUsersByIdsIntegrationResponse(new List<BasicUserInfoDto>());

        // Lấy attributes cho tất cả users
        var userIds = users.Select(u => u.Id).ToList();
        var userAttributesQuery = new GetUserAttributesForUsersIntegrationQuery(userIds);
        var userAttributesResponse = await mediator.Send(userAttributesQuery, cancellationToken);

        // Tạo DTOs
        var dtos = users.Select(user => CreateBasicUserInfoDto(user, userAttributesResponse))
            .ToList();

        return new GetUsersByIdsIntegrationResponse(dtos);
    }

    private static BasicUserInfoDto CreateBasicUserInfoDto(
        User user,
        GetUserAttributesForUsersIntegrationResponse userAttributesResponse)
    {
        var attributes = userAttributesResponse.UserAttributes.GetValueOrDefault(
            user.Id,
            new Dictionary<string, string>());

        // Lấy code ưu tiên StudentCode trước, nếu không có thì lấy EmployeeCode
        var code = GetUserCode(attributes);

        return new BasicUserInfoDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Code = code,
            Email = user.Account?.Email,
            Attributes = attributes
        };
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