using System.ComponentModel.DataAnnotations;

namespace Zentry.Modules.UserManagement.Features.UpdatePassword;

public class UpdatePasswordRequest
{
    [Required] public string NewPassword { get; set; } = string.Empty;
}