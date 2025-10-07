using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zentry.Modules.FaceId.Dtos;
using Zentry.Modules.FaceId.Features.RegisterFaceId;
using Zentry.Modules.FaceId.Features.UpdateFaceId;
using Zentry.Modules.FaceId.Features.VerifyFaceId;
using Zentry.Modules.FaceId.Interfaces;

namespace Zentry.Modules.FaceId.Controllers;

[ApiController]
[Route("api/faceid")]
public class FaceIdController(IMediator mediator, IFaceIdRepository faceIdRepository) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterFaceIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromForm] string userId, IFormFile embedding)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            if (embedding == null)
                return BadRequest("Embedding file is required");

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new RegisterFaceIdCommand(Guid.Parse(userId), embeddingArray);
            var result = await mediator.Send(command);

            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    [HttpGet("meta/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMeta(Guid userId)
    {
        var meta = await faceIdRepository.GetMetaByUserIdAsync(userId);
        if (meta is null)
            return NotFound(new { Message = "Face ID not found for user" });

        return Ok(new
        {
            meta.Value.UserId,
            meta.Value.CreatedAt,
            meta.Value.UpdatedAt
        });
    }

    [HttpGet("users")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await faceIdRepository.GetAllUsersWithFaceIdStatusAsync();
            return Ok(new
            {
                Success = true,
                Data = new
                {
                    TotalCount = users.Count(),
                    Users = users
                },
                Message = "Retrieved all users with Face ID status successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "Error retrieving users: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    [HttpPost("users/status")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetUsersFaceIdStatus([FromBody] GetUsersFaceIdStatusRequest request)
    {
        try
        {
            if (request?.UserIds == null || !request.UserIds.Any())
                return BadRequest(new { Message = "User IDs list is required and cannot be empty" });

            var usersStatus = await faceIdRepository.GetUsersFaceIdStatusAsync(request.UserIds);
            return Ok(new
            {
                Success = true,
                Data = new
                {
                    TotalRequested = request.UserIds.Count(),
                    TotalWithFaceId = usersStatus.Count(u => u.HasFaceId),
                    TotalWithoutFaceId = usersStatus.Count(u => !u.HasFaceId),
                    Users = usersStatus
                },
                Message = "Retrieved Face ID status for requested users successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "Error retrieving users Face ID status: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    [HttpPost("update")]
    [ProducesResponseType(typeof(UpdateFaceIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update([FromForm] string userId, IFormFile embedding)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            if (embedding == null)
                return BadRequest("Embedding file is required");

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new UpdateFaceIdCommand(Guid.Parse(userId), embeddingArray);
            var result = await mediator.Send(command);

            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    [HttpPost("verify")]
    [ProducesResponseType(typeof(VerifyFaceIdResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> Verify([FromForm] string userId, IFormFile embedding,
        [FromForm] float? threshold = null)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest("User ID is required");

            if (embedding == null)
                return BadRequest("Embedding file is required");

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new VerifyFaceIdCommand(
                Guid.Parse(userId),
                embeddingArray,
                threshold ?? 0.7f);

            var result = await mediator.Send(command);

            // Always return 200 OK, with Success = true/false in body
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }
}