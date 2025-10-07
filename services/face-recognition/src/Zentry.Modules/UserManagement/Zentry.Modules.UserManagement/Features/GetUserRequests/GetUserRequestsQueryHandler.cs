using MediatR;
using Zentry.Modules.UserManagement.Dtos;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.SharedKernel.Abstractions.Application;
using Zentry.SharedKernel.Contracts.User;

namespace Zentry.Modules.UserManagement.Features.GetUserRequests;

public class GetUserRequestsQueryHandler(
    IUserRequestRepository userRequestRepository,
    IMediator mediator
) : IQueryHandler<GetUserRequestsQuery, GetUserRequestsResponse>
{
    public async Task<GetUserRequestsResponse> Handle(GetUserRequestsQuery query, CancellationToken cancellationToken)
    {
        var (userRequests, totalCount) = await userRequestRepository.GetUserRequestsAsync(
            query.PageNumber,
            query.PageSize,
            query.Status,
            query.RequestType,
            cancellationToken);

        if (!userRequests.Any())
            return new GetUserRequestsResponse
            {
                UserRequests = new List<UserRequestDto>(),
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalCount = totalCount
            };


        var userIds = userRequests.Select(ur => ur.RequestedByUserId)
            .Union(userRequests.Select(ur => ur.TargetUserId))
            .Distinct()
            .ToList();

        var usersResponse = await mediator.Send(new GetUsersByIdsIntegrationQuery(userIds), cancellationToken);
        var usersDictionary = usersResponse.Users.ToDictionary(u => u.Id, u => u);

        var userRequestDtos = userRequests.Select(ur =>
        {
            usersDictionary.TryGetValue(ur.RequestedByUserId, out var requestedByUser);
            usersDictionary.TryGetValue(ur.TargetUserId, out var targetUser);

            return new UserRequestDto
            {
                Id = ur.Id,
                RequestedByUserId = ur.RequestedByUserId,
                RequestedByUserEmail = requestedByUser?.Email,
                RequestedByUserName = requestedByUser?.FullName,
                TargetUserId = ur.TargetUserId,
                TargetUserEmail = targetUser?.Email,
                TargetUserName = targetUser?.FullName,
                RequestType = ur.RequestType.ToString(),
                RelatedEntityId = ur.RelatedEntityId,
                Status = ur.Status.ToString(),
                CreatedAt = ur.CreatedAt,
                ProcessedAt = ur.ProcessedAt
            };
        }).ToList();

        return new GetUserRequestsResponse
        {
            UserRequests = userRequestDtos,
            PageNumber = query.PageNumber,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }
}