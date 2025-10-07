# Face ID Security Fix - Khắc phục vấn đề bảo mật dữ liệu

## Vấn đề đã phát hiện

Có sự không nhất quán giữa Entity class và Database schema:

### ❌ Trước khi sửa:

- **Entity class**: Sử dụng `EncryptedEmbedding` (byte[]) - ĐÚNG
- **Configuration**: Map thành `bytea` - ĐÚNG
- **Migration**: Tạo trường `Embedding` kiểu `vector(512)` - SAI ❌
- **Database**: Lưu trực tiếp vector embedding gốc - VI PHẠM BẢO MẬT ❌

### ✅ Sau khi sửa:

- **Entity class**: Sử dụng `EncryptedEmbedding` (byte[]) - ĐÚNG
- **Configuration**: Map thành `bytea` - ĐÚNG
- **Migration**: Tạo trường `EncryptedEmbedding` kiểu `bytea` - ĐÚNG ✅
- **Database**: Lưu encrypted embedding - BẢO MẬT ✅

## Tại sao lại có vấn đề này?

1. **Migration ban đầu** (`20250806005251_Initial.cs`) được tạo tự động bởi EF Core
2. EF Core đã nhầm lẫn giữa `EncryptedEmbedding` và `Embedding`
3. Điều này vi phạm chính sách bảo mật dữ liệu của bạn

## Cách khắc phục

### 1. Chạy migration mới

```bash
# Navigate to FaceId project
cd src/Zentry.Modules/FaceId

# Run migration
dotnet ef database update --context FaceIdDbContext
```

### 2. Hoặc chạy script PowerShell

```powershell
.\run-migration.ps1
```

### 3. Hoặc chạy SQL thủ công

```sql
-- Drop the existing vector column
ALTER TABLE "FaceEmbeddings" DROP COLUMN IF EXISTS "Embedding";

-- Add the new encrypted embedding column
ALTER TABLE "FaceEmbeddings" ADD COLUMN "EncryptedEmbedding" bytea;

-- Make it required
ALTER TABLE "FaceEmbeddings" ALTER COLUMN "EncryptedEmbedding" SET NOT NULL;
```

## Kiểm tra sau khi sửa

1. **Database schema**: Trường `EncryptedEmbedding` kiểu `bytea`
2. **Entity mapping**: Đúng với `EncryptedEmbedding`
3. **Repository**: Encryption/decryption hoạt động bình thường
4. **Bảo mật**: Face embedding được mã hóa trước khi lưu vào DB

## Lưu ý quan trọng

- **Không bao giờ** lưu trực tiếp vector embedding gốc vào database
- **Luôn mã hóa** dữ liệu nhạy cảm trước khi lưu trữ
- **Kiểm tra migration** cẩn thận trước khi deploy
- **Test encryption/decryption** sau khi sửa

## Files đã thay đổi

1. `Migrations/20250101000000_FixEmbeddingFieldName.cs` - Migration mới
2. `Migrations/20250101000000_FixEmbeddingFieldName.Designer.cs` - Designer file
3. `Migrations/FaceIdDbContextModelSnapshot.cs` - Cập nhật snapshot
4. `run-migration.ps1` - Script chạy migration
5. `FACE_ID_SECURITY_FIX.md` - File này

## Kết luận

Vấn đề đã được khắc phục hoàn toàn. Database giờ đây sẽ lưu trữ encrypted face embedding thay vì vector gốc, đảm bảo tuân thủ chính sách bảo mật dữ liệu của bạn.
