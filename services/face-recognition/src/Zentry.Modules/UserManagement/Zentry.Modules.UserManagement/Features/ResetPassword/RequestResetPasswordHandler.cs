using MediatR;
using Microsoft.EntityFrameworkCore;
using Zentry.Modules.UserManagement.Persistence.DbContext;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.ResetPassword;

public class RequestResetPasswordHandler(UserDbContext dbContext)
    : ICommandHandler<RequestResetPasswordCommand>
{
    public async Task<Unit> Handle(RequestResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Email == request.Email, cancellationToken);

        if (account is null)
            // For security reasons, always send a success response even if the email doesn't exist
            // to prevent email enumeration.
            return Unit.Value;

        var token = Guid.NewGuid().ToString("N"); // Simple token generation
        var expiryTime = DateTime.Now.AddHours(1); // Token valid for 1 hour

        // Sử dụng phương thức SetResetToken của entity Account
        account.SetResetToken(token, expiryTime);

        await dbContext.SaveChangesAsync(cancellationToken);

        var emailBody = $"Your password reset token is: {token}. It is valid for 1 hour. " +
                        $"Please use this token to reset your password on our website."; // Added more context
        // await emailService.SendEmailAsync(request.Email, "Password Reset Request for Zentry Account", emailBody);

        return Unit.Value;
    }
}