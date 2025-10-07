namespace Zentry.Modules.UserManagement.Interfaces;

public interface IPasswordHasher
{
    /// <summary>
    ///     Hashes a password using Argon2id and returns the hashed password and its salt.
    /// </summary>
    /// <param name="password">The plain-text password to hash.</param>
    /// <returns>A tuple containing the Base64 encoded hash and Base64 encoded salt.</returns>
    (string HashedPassword, string Salt) HashPassword(string password);

    /// <summary>
    ///     Verifies a plain-text password against a stored hashed password and salt using Argon2id.
    /// </summary>
    /// <param name="storedHashedPassword">The Base64 encoded hashed password retrieved from storage.</param>
    /// <param name="storedSalt">The Base64 encoded salt retrieved from storage, used when hashing the password.</param>
    /// <param name="providedPassword">The plain-text password provided by the user.</param>
    /// <returns>True if the password matches, otherwise false.</returns>
    bool VerifyHashedPassword(string storedHashedPassword, string storedSalt, string providedPassword);
}