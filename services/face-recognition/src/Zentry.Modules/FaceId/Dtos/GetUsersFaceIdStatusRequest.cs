namespace Zentry.Modules.FaceId.Dtos;

public class GetUsersFaceIdStatusRequest
{
    public List<Guid> UserIds { get; set; } = new();
}