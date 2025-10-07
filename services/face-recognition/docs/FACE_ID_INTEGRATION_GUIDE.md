## Zentry FaceID — Business Logic & API Design

### Mục tiêu

- Cung cấp xác thực danh tính dựa trên embedding khuôn mặt (vector 512 chiều) cho điểm danh và các nghiệp vụ liên quan.
- Hỗ trợ xác thực đơn lẻ và xác thực theo phiên/lớp học ở quy mô lớn (batch verification).

## Kiến trúc tổng quan

- API layer: `Controllers` nhận multipart/form-data hoặc JSON → gửi `MediatR` command.
- Application layer: `CommandHandler` thực thi nghiệp vụ, gọi `IFaceIdRepository`.
- Persistence: `PostgreSQL + pgvector` lưu `FaceEmbedding` (vector(512)) và `FaceIdVerifyRequest` (audit/phiên xác thực). Dùng raw SQL để insert/update vector.
- Caching/Orchestration: `Redis` lưu metadata request, receipts, danh sách users đã verified; TTL theo thời gian hết hạn.
- Messaging: `MassTransit` publish `NotificationCreatedEvent` cho client recipients (deeplink xác thực).
- Tích hợp: cập nhật trạng thái `HasFaceId` của user qua `UserManagement.UpdateFaceIdCommand`.

Các file chính:

- `Controllers`: `src/Zentry.Modules/FaceId/Controllers/FaceIdController.cs`, `FaceVerificationRequestsController.cs`
- `Handlers`: `Features/RegisterFaceId/*`, `Features/UpdateFaceId/*`, `Features/VerifyFaceId/*`
- `Repository`: `Interfaces/IFaceIdRepository.cs`, `Persistence/Repositories/FaceIdRepository.cs`
- `Entities`: `Entities/FaceEmbedding.cs`, `Entities/FaceIdVerifyRequest.cs`
- `Persistence`: `Persistence/FaceIdDbContext.cs`, `Persistence/Configurations/FaceEmbeddingConfiguration.cs`
- `DI`: `DependencyInjection.cs` (UseNpgsql + UseVector, migrations, MediatR)

## Data Model

### Bảng FaceEmbeddings

- Thuộc tính: `Id (Guid)`, `UserId (Guid, unique)`, `Embedding (vector(512))`, `CreatedAt`, `UpdatedAt`.
- Index: unique trên `UserId` để mỗi user chỉ có một embedding.
- Ghi/đọc vector: raw SQL dùng cú pháp `'[f1,...]'::vector` (định dạng by `InvariantCulture` 6 chữ số thập phân).

### Bảng FaceIdVerifyRequests

- Audit từng lời mời xác thực trong một nhóm request (phiên).
- Thuộc tính: `Id`, `RequestGroupId`, `TargetUserId`, `InitiatorUserId?`, `SessionId?`, `ClassSectionId?`, `Threshold`, `Status`, `CreatedAt`, `ExpiresAt`, `CompletedAt?`, `Matched?`, `Similarity?`.
- Trạng thái: `Pending`, `Completed`, `Expired`, `Canceled`.

### Redis Keys

- `faceid:req:{requestId}:meta` → metadata phiên: recipients, session, lecturer, expiresAt, title/body.
- `faceid:req:{requestId}:user:{userId}` → biên nhận xác thực từng user: success, similarity, verifiedAt.
- `faceid:req:{requestId}:verified` → danh sách `Guid` đã xác thực thành công.

## Business Logic

### Đăng ký FaceID (Register)

- Input: `userId` (GUID), `embedding` (file nhị phân float32; 4 bytes/float; 512 phần tử).
- Nếu user đã có embedding → từ chối và hướng dẫn sử dụng Update.
- Chuyển bytes → float[] → `Pgvector.Vector` → lưu DB bằng raw SQL insert; cập nhật `HasFaceId = true` trong UserManagement.

### Cập nhật FaceID (Update)

- Yêu cầu user đã có embedding.
- Tiền kiểm similarity giữa embedding mới và đang lưu với ngưỡng 0.7. Nếu < ngưỡng → từ chối update.
- Nếu đạt ngưỡng → cập nhật vector bằng raw SQL update; cập nhật `HasFaceId` (đồng thời cập nhật thời gian gần nhất).

### Xác thực FaceID đơn lẻ (Verify)

- Nếu user chưa có embedding → trả `Success=false` với thông điệp phù hợp.
- Chuyển embedding và tính similarity qua SQL: `similarity = 1 - (Embedding <=> input_vector)`.
- So với `threshold` (mặc định 0.7, có thể override), trả về `Success` và `Similarity`. Luôn HTTP 200, kết quả nằm trong body.

### Batch verification theo phiên/lớp (Requests)

1. Tạo request (`Create`):
   - Xác định recipients từ `RecipientUserIds` hoặc từ `ClassSectionId` (qua query integration).
   - Lưu `meta` vào Redis với TTL; persist một `FaceIdVerifyRequest` cho mỗi recipient vào DB.
   - Publish `NotificationCreatedEvent` kèm deeplink: `zentry://face-verify?requestId=...`.
2. Người học xác thực (`Verify by requestId`):
   - Kiểm tra user thuộc recipients và chưa hết hạn.
   - Chuyển embedding, gọi `VerifyFaceIdCommand` với `threshold` (mặc định 0.7).
   - Lưu receipt vào Redis và thêm user vào danh sách `verified` nếu thành công.
   - Ghi kết quả vào DB (`CompleteVerifyRequestCommand`): `Completed + Matched/Similarity`.
3. Theo dõi trạng thái (`Status`):
   - Đọc meta và danh sách `verified` từ Redis để trả tổng recipients và số đã xác thực.
4. Hủy phiên (`Cancel`):
   - Gửi thông báo kết thúc, cập nhật DB các request `Pending` → `Canceled`, xóa meta/verified khỏi Redis.

### Tính tương đồng và ngưỡng

- Sử dụng `pgvector` cosine distance operator `<=>`. `similarity = 1 - distance`.
- Ngưỡng mặc định: 0.7 cho verify và update. Có thể truyền `threshold` khi verify.

## API Design

### 1) FaceIdController

#### POST `api/faceid/register`

- Content-Type: multipart/form-data
- Form fields:
  - `userId`: string (GUID)
  - `embedding`: file nhị phân (512 float32)
- 200: `RegisterFaceIdResponse { Success, Message, Timestamp }`
- 400: thiếu `userId`/`embedding`; 500: lỗi nội bộ

Ví dụ:

```bash
curl -X POST http://localhost:8080/api/faceid/register \
  -F "userId=8a4bd080-ad27-4711-8bb9-199caff56743" \
  -F "embedding=@/path/to/embedding.bin"
```

#### POST `api/faceid/update`

- Content-Type: multipart/form-data
- Form fields: `userId`, `embedding`
- 200: `UpdateFaceIdResponse { Success, Message }` (thất bại nếu similarity < 0.7)
- 400: thiếu input; 500

#### POST `api/faceid/verify`

- Content-Type: multipart/form-data
- Form fields: `userId`, `embedding`, `threshold?` (float)
- 200: `VerifyFaceIdResponse { Success, Message, Timestamp, Similarity }`
  - Lưu ý: luôn 200; `Success` phản ánh kết quả xác thực.

### 2) FaceVerificationRequestsController

#### POST `api/faceid/requests`

- Body (JSON):

```json
{
  "LecturerId": "<guid>",
  "SessionId": "<guid>",
  "ClassSectionId": "<guid?>",
  "RecipientUserIds": ["<guid>", "<guid>"],
  "ExpiresInMinutes": 30,
  "Title": "Yêu cầu xác thực Face ID",
  "Body": "Vui lòng xác thực khuôn mặt để tiếp tục."
}
```

- 201: `{ RequestId, SessionId, ExpiresAt, TotalRecipients, Threshold }`
- 400: thiếu dữ liệu hoặc không có recipients; 500

#### POST `api/faceid/requests/{requestId}/verify`

- Content-Type: multipart/form-data
- Form fields: `userId`, `embedding`, `threshold?`
- 200: `{ Success, Similarity, VerifiedAt }`
- 400: input không hợp lệ/không thuộc recipients
- 404: request không tồn tại/expired
- 410: expired

#### GET `api/faceid/requests/{requestId}/status`

- 200: `{ RequestId, SessionId, ExpiresAt, TotalRecipients, TotalVerified, VerifiedUserIds }`
- 404: not found/expired

#### PATCH `api/faceid/requests/{requestId}/cancel`

- 204 No Content
- 404 nếu không tồn tại/expired

## Xử lý lỗi và mã trạng thái

- Register/Update: 400 khi thiếu input; 200 với `Success=false` cho case nghiệp vụ (đã có/không tồn tại); 500 khi exception.
- Verify đơn lẻ: luôn 200; `Success=false` nếu không đạt ngưỡng hoặc chưa có embedding.
- Batch verify: 400/404/410 như mô tả; 200 body chứa kết quả; 500 khi exception.

## Bảo mật và tuân thủ

- Yêu cầu xác thực/ủy quyền: chỉ giảng viên được tạo/hủy request; sinh viên chỉ verify cho chính họ.
- Giới hạn kích thước upload; kiểm tra content-type; validate số phần tử embedding (khuyến nghị: đúng 512 floats).
- Bảo vệ dữ liệu sinh trắc học: cân nhắc mã hóa at-rest, hạn chế truy cập, thiết lập retention/xóa dữ liệu theo chính sách.
- Rate limiting và audit logging cho endpoints `verify`/`update`.
- Raw SQL với embedding string được tạo server-side; nếu mở rộng nhận dữ liệu từ nguồn khác, cần parameterize để tránh injection.

## Cấu hình & Triển khai

- PostgreSQL với `pgvector`; cấu hình `UseVector()` và migration trong `DependencyInjection.cs`.
- Redis để lưu meta/receipts/danh sách verified với TTL = `expiresAt - now` (tối thiểu 1s).
- MassTransit/RabbitMQ để push `NotificationCreatedEvent` đến recipients; kèm `deeplink` và `action` cho client.
- Ngưỡng `threshold`: mặc định 0.7; cho phép override qua param; có thể nâng cấp để cấu hình qua appsettings.

## Ví dụ phản hồi

```json
{
  "Success": true,
  "Message": "Face ID verified successfully",
  "Timestamp": "2025-08-10T10:00:00Z",
  "Similarity": 0.83
}
```

## Phụ lục: Tham chiếu mã nguồn

- `Controllers`: `src/Zentry.Modules/FaceId/Controllers/FaceIdController.cs`, `src/Zentry.Modules/FaceId/Controllers/FaceVerificationRequestsController.cs`
- `Handlers`: `src/Zentry.Modules/FaceId/Features/RegisterFaceId/*`, `src/Zentry.Modules/FaceId/Features/UpdateFaceId/*`, `src/Zentry.Modules/FaceId/Features/VerifyFaceId/*`
- `Repository`: `src/Zentry.Modules/FaceId/Interfaces/IFaceIdRepository.cs`, `src/Zentry.Modules/FaceId/Persistence/Repositories/FaceIdRepository.cs`
- `Entities`: `src/Zentry.Modules/FaceId/Entities/FaceEmbedding.cs`, `src/Zentry.Modules/FaceId/Entities/FaceIdVerifyRequest.cs`
- `Persistence`: `src/Zentry.Modules/FaceId/Persistence/FaceIdDbContext.cs`, `src/Zentry.Modules/FaceId/Persistence/Configurations/FaceEmbeddingConfiguration.cs`
- `DI`: `src/Zentry.Modules/FaceId/DependencyInjection.cs`

## Đề xuất cải tiến

- Thêm validate số lượng phần tử embedding = 512 trước khi insert/update/verify.
- Trả 404 khi user không có embedding ở verify đơn lẻ (hiện trả 200 với `Success=false`) nếu muốn chuẩn REST hơn.
- Cho phép cấu hình ngưỡng theo từng lớp/phiên trong `Create` (hiện đang cố định 0.7 khi persist).
- Lưu similarity/log chi tiết (ẩn thông tin nhạy cảm) để phục vụ phân tích lỗi và tối ưu mô hình.
