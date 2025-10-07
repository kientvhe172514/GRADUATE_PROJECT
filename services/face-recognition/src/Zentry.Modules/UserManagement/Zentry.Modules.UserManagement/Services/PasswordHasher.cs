using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using Zentry.Modules.UserManagement.Interfaces;

namespace Zentry.Modules.UserManagement.Services;

public class PasswordHasher : IPasswordHasher
{
    // Cấu hình các tham số cho Argon2id.
    // Các giá trị này được điều chỉnh để cân bằng giữa bảo mật và hiệu suất
    // Giảm MemorySize xuống mức hợp lý hơn (ví dụ: 128MB)
    private const int Iterations = 4;
    private const int MemorySize = 128 * 1024; // 128MB RAM
    private const int Parallelism = 2; // Sử dụng 2 luồng CPU
    private const int SaltSize = 16;
    private const int HashSize = 32;

    public (string HashedPassword, string Salt) HashPassword(string password)
    {
        var salt = new byte[SaltSize];
        RandomNumberGenerator.Fill(salt);

        var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            Iterations = Iterations,
            MemorySize = MemorySize,
            DegreeOfParallelism = Parallelism
        };

        var hash = argon2.GetBytes(HashSize);

        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public bool VerifyHashedPassword(string storedHashedPassword, string storedSalt, string providedPassword)
    {
        try
        {
            var salt = Convert.FromBase64String(storedSalt);
            var storedHash = Convert.FromBase64String(storedHashedPassword);

            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(providedPassword))
            {
                Salt = salt,
                Iterations = Iterations,
                MemorySize = MemorySize,
                DegreeOfParallelism = Parallelism
            };

            var computedHash = argon2.GetBytes(HashSize);

            return CryptographicOperations.FixedTimeEquals(computedHash, storedHash);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error during Argon2 verification: {ex.Message}");
            return false;
        }
    }
}