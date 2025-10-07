# Face ID API - Quick Reference

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Generate encryption key
$randomBytes = 1..32 | ForEach-Object { [byte](Get-Random -Min 0 -Max 256) }
$base64Key = [Convert]::ToBase64String($randomBytes)
$env:FACEID_EMBEDDING_KEY = $base64Key

# Start services
docker-compose up postgres redis rabbitmq -d
```

### 2. Test API

```bash
# Register Face ID
POST http://localhost:8080/api/faceid/register
Content-Type: multipart/form-data
- userId: {guid}
- embedding: {binary_file}

# Verify Face ID
POST http://localhost:8080/api/faceid/verify
Content-Type: multipart/form-data
- userId: {guid}
- embedding: {binary_file}
```

## 📋 API Endpoints

| Method  | Endpoint                           | Description                           |
| ------- | ---------------------------------- | ------------------------------------- |
| `POST`  | `/api/faceid/register`             | Register new face ID                  |
| `POST`  | `/api/faceid/update`               | Update existing face ID               |
| `POST`  | `/api/faceid/verify`               | Verify face ID                        |
| `GET`   | `/api/faceid/meta/{userId}`        | Get face ID metadata                  |
| `GET`   | `/api/faceid/users`                | Get all users with Face ID            |
| `POST`  | `/api/faceid/users/status`         | Get Face ID status for specific users |
| `POST`  | `/api/faceid/requests`             | Create verification request           |
| `POST`  | `/api/faceid/requests/{id}/verify` | Verify against request                |
| `GET`   | `/api/faceid/requests/{id}/status` | Get request status                    |
| `PATCH` | `/api/faceid/requests/{id}/cancel` | Cancel request                        |

## 🔐 Encryption

- **Algorithm**: AES-256-GCM
- **Key Source**: `FACEID_EMBEDDING_KEY` environment variable
- **Data**: All face embeddings are encrypted before storage

## 🗄️ Database

- **Tables**: `FaceEmbeddings`, `FaceIdVerifyRequests`
- **Migration**: Automatic on startup via `FaceIdDbMigrationService`
- **Connection**: `Host=localhost;Port=5432;Database=zentry`

## ⚠️ Common Issues

| Error                                      | Solution                    |
| ------------------------------------------ | --------------------------- |
| `FACEID_EMBEDDING_KEY is not configured`   | Set environment variable    |
| `relation "FaceEmbeddings" does not exist` | Restart API                 |
| `CancellationToken mapping error`          | Use EF Core methods (fixed) |

## 📱 Mobile App Integration

### File Format

- **Embedding**: 512 float32 values (2048 bytes)
- **Content-Type**: `multipart/form-data`
- **L2-Normalization**: Apply before sending

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

## 🔧 Development

### Build

```bash
dotnet build src\Zentry.Modules\FaceId\Zentry.Modules.FaceId.csproj
```

### Test

```bash
# Unit tests
dotnet test tests\Zentry.UnitTests\

# Integration tests
dotnet test tests\Zentry.IntegrationTests\
```

## 📚 Full Documentation

See: [Face ID API Documentation](faceid-api-documentation.md)

---

**Need Help?** Check the troubleshooting section in the full documentation.
