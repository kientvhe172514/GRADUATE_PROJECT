namespace Zentry.Modules.FaceId.Dtos;

public class GetUsersFaceIdStatusRequest
{
    public List<int> UserIds { get; set; } = new();
}