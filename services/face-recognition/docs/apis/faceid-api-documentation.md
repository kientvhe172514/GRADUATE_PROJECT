# Face ID API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Endpoints](#api-endpoints)
4. [Data Encryption](#data-encryption)
5. [Face Embedding Processing](#face-embedding-processing)
6. [Database Schema](#database-schema)
7. [Security Considerations](#security-considerations)
8. [Implementation Guide](#implementation-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

## Overview

The Face ID module provides biometric authentication capabilities for the Zentry application. It allows users to register, update, and verify their facial identity using deep learning embeddings. The system implements end-to-end encryption for sensitive biometric data and provides a comprehensive verification request management system for educational institutions.

### Key Features

- **Secure Registration**: Users can register their face using encrypted embeddings
- **Update Capability**: Users can update their face ID with fraud prevention
- **Verification**: Real-time face verification with configurable similarity thresholds
- **Request Management**: Lecturers can create verification sessions for students
- **Audit Trail**: Complete logging and tracking of all operations
- **Encryption**: AES-256-GCM encryption for all biometric data

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile App   │    │   Zentry API     │    │   PostgreSQL    │
│                │    │                  │    │                 │
│ - Face Capture │───▶│ - Face ID Module │───▶│ - Encrypted     │
│ - Embedding    │    │ - Encryption     │    │   Embeddings    │
│ - Verification │    │ - Verification   │    │ - Audit Logs    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Redis Cache    │
                       │                  │
                       │ - Session Data   │
                       │ - Request Meta   │
                       └──────────────────┘
```

### Module Structure

```
Zentry.Modules.FaceId/
├── Controllers/
│   ├── FaceIdController.cs              # Core Face ID operations
│   └── FaceVerificationRequestsController.cs  # Verification requests
├── Entities/
│   ├── FaceEmbedding.cs                 # Face embedding storage
│   └── FaceIdVerifyRequest.cs           # Verification request tracking
├── Features/
│   ├── RegisterFaceId/                  # Registration workflow
│   ├── UpdateFaceId/                    # Update workflow
│   └── VerifyFaceId/                    # Verification workflow
├── Persistence/
│   ├── FaceIdDbContext.cs               # Database context
│   ├── Repositories/                    # Data access layer
│   └── Configurations/                  # EF Core mappings
└── Infrastructure/
    └── Security/                        # Encryption services
```

## API Endpoints

### 1. Face ID Registration

#### `POST /api/faceid/register`

Registers a new face ID for a user.

**Request:**

```http
POST /api/faceid/register
Content-Type: multipart/form-data

userId: {guid}
embedding: {binary_file}
```

**Parameters:**

- `userId` (string, required): User's unique identifier
- `embedding` (file, required): Binary file containing 512 float32 values (2048 bytes)

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "9444745a-4680-4052-849c-d9faa9b95adc",
    "message": "Face ID registered successfully",
    "createdAt": "2025-08-13T19:30:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "User already has a registered Face ID"
  }
}

// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "FACEID_EMBEDDING_KEY is not configured"
  }
}
```

### 2. Face ID Update

#### `POST /api/faceid/update`

Updates an existing face ID with fraud prevention.

**Request:**

```http
POST /api/faceid/update
Content-Type: multipart/form-data

userId: {guid}
embedding: {binary_file}
```

**Parameters:**

- `userId` (string, required): User's unique identifier
- `embedding` (file, required): New face embedding (512 float32 values)

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "9444745a-4680-4052-849c-d9faa9b95adc",
    "message": "Face ID updated successfully",
    "updatedAt": "2025-08-13T19:35:00.000Z"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Face embedding for user not found"
  }
}

// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_OPERATION",
    "message": "New embedding too similar to existing one (potential fraud)"
  }
}
```

### 3. Face ID Verification

#### `POST /api/faceid/verify`

Performs ad-hoc face verification.

**Request:**

```http
POST /api/faceid/verify
Content-Type: multipart/form-data

userId: {guid}
embedding: {binary_file}
threshold: {float} (optional, default: 0.7)
```

**Parameters:**

- `userId` (string, required): User's unique identifier
- `embedding` (file, required): Face embedding to verify (512 float32 values)
- `threshold` (float, optional): Similarity threshold (0.0 - 1.0, default: 0.7)

**Response:**

```json
{
  "success": true,
  "data": {
    "isMatch": true,
    "similarity": 0.89,
    "threshold": 0.7,
    "message": "Face verification successful"
  }
}
```

**Error Responses:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Face ID not found for this user"
  }
}

// 400 Bad Request
{
  "success": false,
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Face verification failed - similarity too low"
  }
}
```

### 4. Face ID Metadata

#### `GET /api/faceid/meta/{userId}`

Retrieves metadata for a user's Face ID.

**Request:**

```http
GET /api/faceid/meta/9444745a-4680-4052-849c-d9faa9b95adc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "9444745a-4680-4052-849c-d9faa9b95adc",
    "createdAt": "2025-08-13T19:30:00.000Z",
    "updatedAt": "2025-08-13T19:35:00.000Z"
  }
}
```

**Error Response:**

```json
// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Face ID not found for this user"
  }
}
```

#### `GET /api/faceid/users`

Retrieves all user IDs that have registered Face IDs.

**Request:**

```http
GET /api/faceid/users
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalCount": 3,
    "users": [
      {
        "userId": "9444745a-4680-4052-849c-d9faa9b95adc",
        "hasFaceId": true,
        "createdAt": "2025-08-13T19:30:00.000Z",
        "updatedAt": "2025-08-13T19:35:00.000Z"
      },
      {
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "hasFaceId": true,
        "createdAt": "2025-08-13T19:40:00.000Z",
        "updatedAt": "2025-08-13T19:40:00.000Z"
      }
    ]
  },
  "message": "Retrieved all users with Face ID status successfully"
}
```

**Error Response:**

```json
// 500 Internal Server Error
{
  "success": false,
  "message": "Error retrieving users: Database connection failed",
  "timestamp": "2025-08-13T19:45:00.000Z"
}
```

#### `POST /api/faceid/users/status`

Retrieves Face ID status for specific users, including those without Face ID.

**Request:**

```http
POST /api/faceid/users/status
Content-Type: application/json

{
  "userIds": [
    "9444745a-4680-4052-849c-d9faa9b95adc",
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "f9e8d7c6-b5a4-3210-9876-543210fedcba"
  ]
}
```

**Parameters:**

- `userIds` (array, required): List of user IDs to check Face ID status

**Response:**

```json
{
  "success": true,
  "data": {
    "totalRequested": 3,
    "totalWithFaceId": 2,
    "totalWithoutFaceId": 1,
    "users": [
      {
        "userId": "9444745a-4680-4052-849c-d9faa9b95adc",
        "hasFaceId": true,
        "createdAt": "2025-08-13T19:30:00.000Z",
        "updatedAt": "2025-08-13T19:35:00.000Z"
      },
      {
        "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "hasFaceId": true,
        "createdAt": "2025-08-13T19:40:00.000Z",
        "updatedAt": "2025-08-13T19:40:00.000Z"
      },
      {
        "userId": "f9e8d7c6-b5a4-3210-9876-543210fedcba",
        "hasFaceId": false,
        "createdAt": null,
        "updatedAt": null
      }
    ]
  },
  "message": "Retrieved Face ID status for requested users successfully"
}
```

**Error Response:**

```json
// 400 Bad Request
{
  "success": false,
  "message": "User IDs list is required and cannot be empty"
}
```

### 5. Verification Request Management

#### `POST /api/faceid/requests`

Creates a new verification request session.

**Request:**

```http
POST /api/faceid/requests
Content-Type: application/json

{
  "initiatorUserId": "lecturer-guid",
  "classSectionId": "class-guid",
  "recipientUserIds": ["student1-guid", "student2-guid"],
  "threshold": 0.7,
  "durationMinutes": 30
}
```

**Parameters:**

- `initiatorUserId` (string, required): Lecturer's user ID
- `classSectionId` (string, required): Class section identifier
- `recipientUserIds` (array, required): List of student user IDs
- `threshold` (float, optional): Similarity threshold (default: 0.7)
- `durationMinutes` (integer, optional): Session duration (default: 30)

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "request-guid",
    "sessionId": "session-guid",
    "expiresAt": "2025-08-13T20:00:00.000Z",
    "recipientCount": 2,
    "message": "Verification request created successfully"
  }
}
```

#### `POST /api/faceid/requests/{requestId}/verify`

Verifies a user against a specific verification request.

**Request:**

```http
POST /api/faceid/requests/request-guid/verify
Content-Type: multipart/form-data

userId: {guid}
embedding: {binary_file}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "isMatch": true,
    "similarity": 0.89,
    "requestId": "request-guid",
    "status": "VERIFIED",
    "message": "Verification successful"
  }
}
```

#### `GET /api/faceid/requests/{requestId}/status`

Gets the status of a verification request.

**Request:**

```http
GET /api/faceid/requests/request-guid/status
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "request-guid",
    "sessionId": "session-guid",
    "status": "ACTIVE",
    "expiresAt": "2025-08-13T20:00:00.000Z",
    "totalRecipients": 2,
    "verifiedCount": 1,
    "verifiedUsers": ["student1-guid"],
    "pendingUsers": ["student2-guid"]
  }
}
```

#### `PATCH /api/faceid/requests/{requestId}/cancel`

Cancels an active verification request.

**Request:**

```http
PATCH /api/faceid/requests/request-guid/cancel
```

**Response:**

```http
204 No Content
```

## Data Encryption

### Encryption Algorithm

The system uses **AES-256-GCM** (Galois/Counter Mode) for encrypting face embeddings.

### Key Management

```csharp
// Environment Variables (Priority Order)
1. FACEID_EMBEDDING_KEY          // System environment variable
2. FaceId:EncryptionKey          // Configuration section
3. FaceId__EncryptionKey         // .NET environment variable style

// Key Requirements
- Length: 32 bytes (256 bits)
- Format: Base64 encoded string
- Example: "vmwZ8jqr1/4Qc5Xnw9RCxY+3txA12oSNCD/+/+j71Qc="
```

### Encryption Process

```csharp
public byte[] Encrypt(byte[] plaintext)
{
    using var aes = Aes.Create();
    aes.Key = _key;
    aes.Mode = CipherMode.GCM;

    var nonce = new byte[12];
    RandomNumberGenerator.Fill(nonce);

    using var encryptor = aes.CreateEncryptor();
    var ciphertext = encryptor.TransformFinalBlock(plaintext, 0, plaintext.Length);

    // Combine nonce + ciphertext + tag
    var result = new byte[12 + ciphertext.Length + 16];
    Buffer.BlockCopy(nonce, 0, result, 0, 12);
    Buffer.BlockCopy(ciphertext, 0, result, 12, ciphertext.Length);
    Buffer.BlockCopy(encryptor.GetTag(), 0, result, 12 + ciphertext.Length, 16);

    return result;
}
```

### Decryption Process

```csharp
public byte[] Decrypt(byte[] ciphertext)
{
    using var aes = Aes.Create();
    aes.Key = _key;
    aes.Mode = CipherMode.GCM;

    // Extract nonce, ciphertext, and tag
    var nonce = new byte[12];
    var encryptedData = new byte[ciphertext.Length - 28];
    var tag = new byte[16];

    Buffer.BlockCopy(ciphertext, 0, nonce, 0, 12);
    Buffer.BlockCopy(ciphertext, 12, encryptedData, 0, encryptedData.Length);
    Buffer.BlockCopy(ciphertext, ciphertext.Length - 16, tag, 0, 16);

    aes.IV = nonce;
    using var decryptor = aes.CreateDecryptor();
    decryptor.SetTag(tag);

    return decryptor.TransformFinalBlock(encryptedData, 0, encryptedData.Length);
}
```

## Face Embedding Processing

### Data Flow

```
1. Mobile App: Face Capture → AI Model → 512-dim Vector
2. Mobile App: L2-Normalization → Binary File
3. API: Receive Binary → Convert to float[]
4. API: L2-Normalization → Encryption → Database
5. Verification: Decrypt → L2-Normalization → Cosine Similarity
```

### L2-Normalization

```csharp
private static void NormalizeL2(float[] vector)
{
    double sum = 0;
    for (int i = 0; i < vector.Length; i++)
        sum += vector[i] * vector[i];

    var norm = Math.Sqrt(sum);
    if (norm == 0) return;

    for (int i = 0; i < vector.Length; i++)
        vector[i] = (float)(vector[i] / norm);
}
```

### Cosine Similarity Calculation

```csharp
private static float CalculateCosineSimilarity(float[] vector1, float[] vector2)
{
    if (vector1.Length != vector2.Length)
        throw new ArgumentException("Vectors must have same length");

    float dotProduct = 0;
    for (int i = 0; i < vector1.Length; i++)
        dotProduct += vector1[i] * vector2[i];

    return dotProduct; // Vectors are already L2-normalized
}
```

### Binary Conversion

```csharp
// Float array to bytes
var rawBytes = new byte[embedding.Length * 4];
Buffer.BlockCopy(embedding, 0, rawBytes, 0, rawBytes.Length);

// Bytes to float array
var stored = new float[decrypted.Length / 4];
Buffer.BlockCopy(decrypted, 0, stored, 0, decrypted.Length);
```

## Database Schema

### FaceEmbeddings Table

```sql
CREATE TABLE IF NOT EXISTS "FaceEmbeddings" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" UUID NOT NULL UNIQUE,
    "EncryptedEmbedding" BYTEA NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IX_FaceEmbeddings_UserId" ON "FaceEmbeddings" ("UserId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_FaceEmbeddings_UserId_Unique" ON "FaceEmbeddings" ("UserId");
```

### FaceIdVerifyRequests Table

```sql
CREATE TABLE IF NOT EXISTS "FaceIdVerifyRequests" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RequestGroupId" UUID NOT NULL,
    "TargetUserId" UUID NOT NULL,
    "InitiatorUserId" UUID,
    "SessionId" UUID NOT NULL,
    "ClassSectionId" UUID,
    "Threshold" REAL NOT NULL DEFAULT 0.7,
    "Status" TEXT NOT NULL DEFAULT 'PENDING',
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CompletedAt" TIMESTAMP WITH TIME ZONE,
    "Matched" BOOLEAN,
    "Similarity" REAL,
    "NotificationId" UUID,
    "MetadataJson" TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_RequestGroupId" ON "FaceIdVerifyRequests" ("RequestGroupId");
CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_TargetUserId" ON "FaceIdVerifyRequests" ("TargetUserId");
CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_SessionId" ON "FaceIdVerifyRequests" ("SessionId");
CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_Status" ON "FaceIdVerifyRequests" ("Status");
```

## Security Considerations

### Data Protection

- **At-Rest Encryption**: All face embeddings are encrypted using AES-256-GCM
- **Key Rotation**: Encryption keys can be rotated (requires re-encryption of existing data)
- **Access Control**: API endpoints require proper authentication and authorization
- **Audit Logging**: All operations are logged with timestamps and user context

### Privacy Compliance

- **GDPR Compliance**: Personal biometric data is encrypted and access-controlled
- **Data Minimization**: Only necessary data is stored (encrypted embeddings + metadata)
- **Right to Erasure**: Users can request deletion of their face data
- **Data Portability**: Encrypted data can be exported in encrypted format

### Threat Mitigation

- **Replay Attacks**: Nonce-based encryption prevents replay attacks
- **Man-in-the-Middle**: HTTPS/TLS encryption for data in transit
- **Brute Force**: 256-bit encryption key provides sufficient security
- **Insider Threats**: Database access is restricted and monitored

## Implementation Guide

### 1. Environment Setup

```bash
# Generate encryption key
$randomBytes = 1..32 | ForEach-Object { [byte](Get-Random -Min 0 -Max 256) }
$base64Key = [Convert]::ToBase64String($randomBytes)

# Set environment variable
$env:FACEID_EMBEDDING_KEY = $base64Key

# Or add to appsettings.json
{
  "FaceId": {
    "EncryptionKey": "your-base64-key-here"
  }
}
```

### 2. Database Setup

```bash
# Start required services
docker-compose up postgres redis rabbitmq -d

# Verify services are running
docker-compose ps
```

### 3. API Configuration

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=zentry;Username=admin;Password=pass;",
    "PostgresConnection": "Host=localhost;Port=5432;Database=zentry;Username=admin;Password=pass;"
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  },
  "RabbitMQ": {
    "Host": "localhost",
    "Username": "admin",
    "Password": "pass"
  }
}
```

### 4. Service Registration

```csharp
// Program.cs or Startup.cs
services.AddScoped<IFaceIdRepository, FaceIdRepository>();
services.AddScoped<IDataProtectionService, DataProtectionService>();
services.AddScoped<IRedisService, RedisService>();
services.AddScoped<IPublishEndpoint, PublishEndpoint>();
```

## Testing

### Unit Tests

```csharp
[Test]
public async Task RegisterFaceId_ValidData_ShouldSucceed()
{
    // Arrange
    var userId = Guid.NewGuid();
    var embedding = GenerateTestEmbedding();

    // Act
    var result = await _faceIdService.RegisterAsync(userId, embedding);

    // Assert
    Assert.IsTrue(result.IsSuccess);
    Assert.AreEqual(userId, result.Data.UserId);
}
```

### Integration Tests

```csharp
[Test]
public async Task FaceIdVerification_EndToEnd_ShouldWork()
{
    // Arrange
    var userId = Guid.NewGuid();
    var embedding = GenerateTestEmbedding();

    // Register
    await _faceIdService.RegisterAsync(userId, embedding);

    // Verify
    var verificationResult = await _faceIdService.VerifyAsync(userId, embedding);

    // Assert
    Assert.IsTrue(verificationResult.IsMatch);
    Assert.Greater(verificationResult.Similarity, 0.7f);
}
```

### API Testing with Postman

```http
POST http://localhost:8080/api/faceid/register
Content-Type: multipart/form-data

userId: 9444745a-4680-4052-849c-d9faa9b95adc
embedding: @/path/to/embedding.bin
```

## Troubleshooting

### Common Issues

#### 1. Encryption Key Not Configured

```
Error: FACEID_EMBEDDING_KEY is not configured
Solution: Set environment variable or add to appsettings.json
```

#### 2. Database Connection Issues

```
Error: relation "FaceEmbeddings" does not exist
Solution: Restart API to trigger FaceIdDbMigrationService
```

#### 3. CancellationToken Mapping Error

```
Error: The current provider doesn't have a store type mapping for properties of type 'CancellationToken'
Solution: Use EF Core methods instead of raw SQL
```

#### 4. Low Similarity Scores

```
Issue: Similarity scores below threshold despite same face
Solution: Ensure L2-normalization is applied on both client and server
```

### Debug Steps

1. **Check Environment Variables**: Verify `FACEID_EMBEDDING_KEY` is set
2. **Database Logs**: Check for migration and table creation messages
3. **API Logs**: Look for encryption and verification process logs
4. **Service Status**: Ensure PostgreSQL, Redis, and RabbitMQ are running
5. **Connection Strings**: Verify database connection strings point to correct hosts

### Performance Optimization

- **Caching**: Redis caches verification request metadata
- **Batch Operations**: Multiple verifications can be processed in batches
- **Async Operations**: All database operations are asynchronous
- **Connection Pooling**: EF Core connection pooling for database efficiency

## API Versioning

### Current Version: v1

- Base URL: `/api/faceid`
- All endpoints return consistent JSON response format
- Error codes follow standard HTTP status codes
- Response format includes success flag, data, and error information

### Future Enhancements

- **v2**: Support for multiple face embeddings per user
- **v3**: Advanced fraud detection algorithms
- **v4**: Real-time face recognition streaming
- **v5**: Integration with external biometric providers

---

**Last Updated**: 2025-08-13  
**Version**: 1.0.0  
**Maintainer**: Zentry Development Team
