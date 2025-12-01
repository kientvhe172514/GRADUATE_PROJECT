using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Zentry.Modules.FaceId.Dtos;
using Zentry.Modules.FaceId.Features.DeleteFaceId;
using Zentry.Modules.FaceId.Features.RegisterFaceId;
using Zentry.Modules.FaceId.Features.UpdateFaceId;
using Zentry.Modules.FaceId.Features.VerifyFaceId;
using Zentry.Modules.FaceId.Interfaces;

namespace Zentry.Modules.FaceId.Controllers;

[ApiController]
[Route("faceid")]
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
                return BadRequest(new { Success = false, Message = "User ID is required" });

            // Parse userId as int
            if (!int.TryParse(userId, out var intUserId))
            {
                return BadRequest(new { Success = false, Message = $"Invalid User ID format. Expected int, received: {userId}" });
            }

            if (embedding == null)
                return BadRequest(new { Success = false, Message = "Embedding file is required" });

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            // Validate embedding size
            if (embeddingBytes.Length == 0)
                return BadRequest(new { Success = false, Message = "Embedding file is empty" });
            
            if (embeddingBytes.Length % 4 != 0)
                return BadRequest(new { Success = false, Message = $"Invalid embedding size. Must be multiple of 4 bytes, received: {embeddingBytes.Length} bytes" });

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new RegisterFaceIdCommand(intUserId, embeddingArray);
            var result = await mediator.Send(command);

            if (result.Success)
                return Ok(result);
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            // Log full exception với stack trace
            Console.WriteLine($"❌ [FaceIdController.Register] Exception: {ex.GetType().Name}");
            Console.WriteLine($"   Message: {ex.Message}");
            Console.WriteLine($"   StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"   InnerException: {ex.InnerException.Message}");
                Console.WriteLine($"   InnerStackTrace: {ex.InnerException.StackTrace}");
            }
            
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error: " + ex.Message,
                Detail = ex.InnerException?.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }

    [HttpGet("meta/{userId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMeta(string userId)
    {
        // Parse userId as int
        if (!int.TryParse(userId, out var intUserId))
        {
            return BadRequest(new { Success = false, Message = $"Invalid User ID format. Expected int, received: {userId}" });
        }

        var meta = await faceIdRepository.GetMetaByUserIdAsync(intUserId);
        if (meta is null)
            return NotFound(new { Success = false, Message = "Face ID not found for user" });

        return Ok(new
        {
            Success = true,
            Data = new
            {
                UserId = userId, // Return original format
                meta.Value.CreatedAt,
                meta.Value.UpdatedAt
            }
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
                return BadRequest(new { Success = false, Message = "User ID is required" });

            // Parse userId as int
            if (!int.TryParse(userId, out var intUserId))
            {
                return BadRequest(new { Success = false, Message = $"Invalid User ID format. Expected int, received: {userId}" });
            }

            if (embedding == null)
                return BadRequest(new { Success = false, Message = "Embedding file is required" });

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            if (embeddingBytes.Length == 0 || embeddingBytes.Length % 4 != 0)
                return BadRequest(new { Success = false, Message = $"Invalid embedding size: {embeddingBytes.Length} bytes" });

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new UpdateFaceIdCommand(intUserId, embeddingArray);
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
                return BadRequest(new { Success = false, Message = "User ID is required" });

            // Parse userId as int
            if (!int.TryParse(userId, out var intUserId))
            {
                return BadRequest(new { Success = false, Message = $"Invalid User ID format. Expected int, received: {userId}" });
            }

            if (embedding == null)
                return BadRequest(new { Success = false, Message = "Embedding file is required" });

            // Read embedding bytes
            using var memoryStream = new MemoryStream();
            await embedding.CopyToAsync(memoryStream);
            var embeddingBytes = memoryStream.ToArray();

            if (embeddingBytes.Length == 0 || embeddingBytes.Length % 4 != 0)
                return BadRequest(new { Success = false, Message = $"Invalid embedding size: {embeddingBytes.Length} bytes" });

            // Convert bytes to float array (4 bytes per float)
            var embeddingArray = new float[embeddingBytes.Length / 4];
            Buffer.BlockCopy(embeddingBytes, 0, embeddingArray, 0, embeddingBytes.Length);

            // Create and send command
            var command = new VerifyFaceIdCommand(
                intUserId,
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

    [HttpDelete("{userId}")]
    [ProducesResponseType(typeof(DeleteFaceIdResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(string userId)
    {
        try
        {
            if (string.IsNullOrEmpty(userId))
                return BadRequest(new { Success = false, Message = "User ID is required" });

            // Parse userId as int
            if (!int.TryParse(userId, out var intUserId))
            {
                return BadRequest(new { Success = false, Message = $"Invalid User ID format. Expected int, received: {userId}" });
            }

            // Create and send command
            var command = new DeleteFaceIdCommand(intUserId);
            var result = await mediator.Send(command);

            if (result.Success)
                return Ok(result);
            
            // If user doesn't have face ID, return 404
            if (result.Message.Contains("does not have"))
                return NotFound(result);
                
            return BadRequest(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ [FaceIdController.Delete] Exception: {ex.GetType().Name}");
            Console.WriteLine($"   Message: {ex.Message}");
            Console.WriteLine($"   StackTrace: {ex.StackTrace}");
            
            return StatusCode(500, new
            {
                Success = false,
                Message = "Internal server error: " + ex.Message,
                Timestamp = DateTime.UtcNow.ToString("o")
            });
        }
    }
}