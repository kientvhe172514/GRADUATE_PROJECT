using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;

namespace Zentry.Infrastructure.Security.Encryption;

public class DataProtectionService
{
    private readonly byte[] _key;

    public DataProtectionService(IConfiguration configuration)
    {
        // Try multiple sources for the encryption key
        var base64Key = Environment.GetEnvironmentVariable("FACEID_EMBEDDING_KEY") // System environment variable
                        ?? configuration["FACEID_EMBEDDING_KEY"] // Configuration
                        ?? configuration.GetSection("FaceId")?["EncryptionKey"] // FaceId:EncryptionKey
                        ?? Environment.GetEnvironmentVariable(
                            "FaceId__EncryptionKey") // FaceId__EncryptionKey (dotnet style)
                        ?? string.Empty;

        if (string.IsNullOrWhiteSpace(base64Key))
        {
            var availableKeys = new List<string>();
            var envKey = Environment.GetEnvironmentVariable("FACEID_EMBEDDING_KEY");
            if (!string.IsNullOrEmpty(envKey)) availableKeys.Add("FACEID_EMBEDDING_KEY (env)");

            var configKey = configuration["FACEID_EMBEDDING_KEY"];
            if (!string.IsNullOrEmpty(configKey)) availableKeys.Add("FACEID_EMBEDDING_KEY (config)");

            var faceIdKey = configuration.GetSection("FaceId")?["EncryptionKey"];
            if (!string.IsNullOrEmpty(faceIdKey)) availableKeys.Add("FaceId:EncryptionKey (config)");

            var dotnetKey = Environment.GetEnvironmentVariable("FaceId__EncryptionKey");
            if (!string.IsNullOrEmpty(dotnetKey)) availableKeys.Add("FaceId__EncryptionKey (env)");

            var errorMessage = "FACEID_EMBEDDING_KEY is not configured. ";
            if (availableKeys.Count > 0)
                errorMessage += $"Available keys: {string.Join(", ", availableKeys)}";
            else
                errorMessage +=
                    "Please set one of: FACEID_EMBEDDING_KEY environment variable, FaceId:EncryptionKey in appsettings, or FaceId__EncryptionKey environment variable";

            throw new InvalidOperationException(errorMessage);
        }

        try
        {
            _key = Convert.FromBase64String(base64Key);
            if (_key.Length != 32)
                throw new InvalidOperationException(
                    $"FACEID_EMBEDDING_KEY must be 32 bytes (Base64 of 32 bytes) for AES-256-GCM. Current length: {_key.Length} bytes");
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("FACEID_EMBEDDING_KEY must be a valid Base64 string");
        }
    }

    public byte[] Encrypt(byte[] plaintext)
    {
        var nonce = RandomNumberGenerator.GetBytes(12);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[16];
        using var aes = new AesGcm(_key);
        aes.Encrypt(nonce, plaintext, ciphertext, tag);
        return Combine(nonce, tag, ciphertext);
    }

    public byte[] Decrypt(byte[] encrypted)
    {
        if (encrypted.Length < 12 + 16) throw new ArgumentException("Invalid encrypted payload");
        var nonce = encrypted.AsSpan(0, 12).ToArray();
        var tag = encrypted.AsSpan(12, 16).ToArray();
        var ciphertext = encrypted.AsSpan(28).ToArray();
        var plaintext = new byte[ciphertext.Length];
        using var aes = new AesGcm(_key);
        aes.Decrypt(nonce, ciphertext, tag, plaintext);
        return plaintext;
    }

    private static byte[] Combine(params byte[][] arrays)
    {
        var total = arrays.Sum(a => a.Length);
        var result = new byte[total];
        var offset = 0;
        foreach (var a in arrays)
        {
            Buffer.BlockCopy(a, 0, result, offset, a.Length);
            offset += a.Length;
        }

        return result;
    }
}