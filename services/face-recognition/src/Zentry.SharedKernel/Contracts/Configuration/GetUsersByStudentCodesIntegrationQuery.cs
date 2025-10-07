using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.SharedKernel.Contracts.Configuration;

public class GetUsersByStudentCodesIntegrationQuery : IQuery<GetUsersByStudentCodesIntegrationResponse>
{
    public GetUsersByStudentCodesIntegrationQuery(List<string> studentCodes)
    {
        StudentCodes = studentCodes ?? throw new ArgumentNullException(nameof(studentCodes));
    }

    public List<string> StudentCodes { get; }
}

public class GetUsersByStudentCodesIntegrationResponse
{
    public GetUsersByStudentCodesIntegrationResponse(Dictionary<string, Guid> studentCodeToUserIdMap)
    {
        StudentCodeToUserIdMap = studentCodeToUserIdMap;
    }

    public Dictionary<string, Guid> StudentCodeToUserIdMap { get; }
}