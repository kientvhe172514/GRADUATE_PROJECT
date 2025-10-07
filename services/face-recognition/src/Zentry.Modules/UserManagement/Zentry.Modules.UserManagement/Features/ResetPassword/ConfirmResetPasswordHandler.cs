using MediatR;
using Microsoft.EntityFrameworkCore;
using Zentry.Modules.UserManagement.Interfaces;
using Zentry.Modules.UserManagement.Persistence.DbContext;
using Zentry.SharedKernel.Abstractions.Application;

namespace Zentry.Modules.UserManagement.Features.ResetPassword;

public class ConfirmResetPasswordHandler(UserDbContext dbContext, IPasswordHasher passwordHasher)
    : ICommandHandler<ConfirmResetPasswordCommand>
{
    public async Task<Unit> Handle(ConfirmResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var account = await dbContext.Accounts
            .FirstOrDefaultAsync(a => a.Email == request.Email && a.ResetToken == request.Token, cancellationToken);

        // Check if account exists, token matches, and token is not expired
        if (account == null || account.ResetTokenExpiryTime == null || account.ResetTokenExpiryTime <= DateTime.Now)
        {
            // IMPORTANT: If a token was found but expired/invalid, clear it to prevent further attempts.
            // Sử dụng phương thức ClearResetToken của entity Account
            if (account != null)
            {
                account.ClearResetToken();
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            throw new InvalidOperationException("Invalid or expired token. Please request a new password reset.");
        }

        // Hash new password using Argon2id và sử dụng phương thức SetNewPassword của entity Account
        var (newPasswordHash, newPasswordSalt) = passwordHasher.HashPassword(request.NewPassword);
        account.SetNewPassword(newPasswordHash, newPasswordSalt);

        // Clear the token and expiry time after successful reset bằng phương thức ClearResetToken
        account.ClearResetToken();

        await dbContext.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}