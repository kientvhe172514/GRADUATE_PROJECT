using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Zentry.Modules.UserManagement.Interfaces;

namespace Zentry.Modules.UserManagement.Services;

public class JwtService(IConfiguration configuration) : IJwtService
{
    private readonly string _audience = configuration["Jwt:Audience"] ?? "ZentryUsers"; // Default audience

    private readonly int
        _expirationMinutes = int.Parse(configuration["Jwt:ExpirationMinutes"] ?? "60"); // Default 60 minutes

    private readonly string _issuer = configuration["Jwt:Issuer"] ?? "Zentry"; // Default issuer

    private readonly string _secret =
        configuration["Jwt:Secret"] ?? throw new ArgumentNullException("JWT Secret not configured.");

    public string GenerateToken(Guid userId, string email, string fullName, string role)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secret);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, fullName),
            new(ClaimTypes.Role, role)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddMinutes(_expirationMinutes),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials =
                new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}