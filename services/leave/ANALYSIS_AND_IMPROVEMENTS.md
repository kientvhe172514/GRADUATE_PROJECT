# 📊 LEAVE SERVICE - PHÂN TÍCH & BỔ SUNG NGHIỆP VỤ

## 🎯 TỔNG QUAN HIỆN TẠI

### ✅ Những gì đã có (GOOD):
1. **Domain Entities**: 
   - ✅ LeaveType (loại phép)
   - ✅ LeaveBalance (số dư phép)
   - ✅ LeaveRecord (đơn xin nghỉ)
   - ✅ Holiday (ngày lễ)
   - ✅ LeaveBalanceTransaction (audit trail)

2. **Use Cases đã implement**:
   - ✅ Create/Update/Cancel leave request
   - ✅ Approve/Reject leave
   - ✅ Get leave records with filters
   - ✅ Get my leaves (`/leave-records/me`)
   - ✅ Initialize/Adjust leave balance
   - ✅ Carry-over logic

3. **Infrastructure**:
   - ✅ TypeORM schemas
   - ✅ Repository pattern
   - ✅ Clean Architecture structure

---

## 🔴 VẤN ĐỀ NGHIÊM TRỌNG CẦN SỬA NGAY

### 1. **THIẾU ENDPOINT `/leave-balances/me`** ⚠️

**Vấn đề**: Employee không thể tự xem số phép còn lại của mình!

**Hiện tại**:
```
GET /leave-balances/employee/:employeeId  ❌ Phải biết employeeId
GET /leave-records/me                      ✅ OK - xem đơn nghỉ
```

**Cần thêm**:
```
GET /leave-balances/me                     ✅ Tự động lấy từ JWT token
```

---

### 2. **KHÔNG GHI TRANSACTION KHI APPROVE/REJECT/CANCEL** 🔥

**Vấn đề nghiêm trọng**: 
- ❌ Table `leave_balance_transactions` đã có nhưng KHÔNG được sử dụng
- ❌ Không có audit trail khi balance thay đổi
- ❌ Không truy vết được ai approve, reject, cancel và khi nào
- ❌ Không biết balance trước/sau khi thay đổi

**Code hiện tại** (approve-leave.use-case.ts):
```typescript
// ❌ CHỈ CẬP NHẬT BALANCE - KHÔNG GHI TRANSACTION
await this.leaveBalanceRepository.update(balance.id, {
  pending_days: newPendingDays,
  used_days: newUsedDays,
});
```

**Cần sửa thành**:
```typescript
// ✅ CẬP NHẬT BALANCE + GHI TRANSACTION
const balanceBefore = balance.remaining_days;

await this.leaveBalanceRepository.update(balance.id, {
  pending_days: newPendingDays,
  used_days: newUsedDays,
});

// ✅ GHI TRANSACTION ĐỂ AUDIT
await this.transactionRepository.create({
  employee_id: leaveRecord.employee_id,
  leave_type_id: leaveRecord.leave_type_id,
  year: year,
  transaction_type: 'APPROVED',
  amount: -leaveDays,
  balance_before: balanceBefore,
  balance_after: balanceBefore - leaveDays,
  reference_type: 'LEAVE_RECORD',
  reference_id: leaveRecordId,
  description: `Leave approved: ${leaveRecord.reason}`,
  created_by: dto.approved_by,
});
```

---

### 3. **THIẾU USE CASES QUAN TRỌNG**

#### ❌ **Get Leave Balance Transactions** (Xem lịch sử thay đổi phép)
```typescript
// Cần implement:
GET /leave-balances/transactions/me
GET /leave-balances/employee/:employeeId/transactions
```

#### ❌ **Get Leave Statistics** (Thống kê phép năm)
```typescript
// Cần implement:
GET /leave-balances/me/statistics?year=2025
{
  total_entitled: 20,
  used: 5,
  pending: 2,
  remaining: 13,
  carried_over: 3,
  expiring_soon: 2,
  by_type: [...]
}
```

#### ❌ **Bulk Initialize Balances** (Khởi tạo hàng loạt đầu năm)
```typescript
// Cần implement:
POST /leave-balances/bulk-initialize
{
  year: 2025,
  employee_ids: [1, 2, 3, ...] // hoặc department_id
}
```

---

## 📋 DANH SÁCH BỔ SUNG THEO CLEAN ARCHITECTURE

### A. DOMAIN LAYER

#### 1. **Value Objects** (chưa có)
```typescript
// domain/value-objects/date-range.vo.ts
export class DateRange {
  constructor(
    public readonly start: Date,
    public readonly end: Date
  ) {
    if (start > end) throw new Error('Invalid date range');
  }
  
  getWorkingDays(excludeWeekends: boolean, holidays: Date[]): number {
    // Logic tính ngày làm việc
  }
}
```

#### 2. **Domain Events** (chưa có)
```typescript
// domain/events/leave-approved.event.ts
export class LeaveApprovedEvent {
  constructor(
    public readonly leaveRecordId: number,
    public readonly employeeId: number,
    public readonly approvedBy: number,
    public readonly leaveDays: number,
  ) {}
}
```

#### 3. **Domain Services** (chưa có)
```typescript
// domain/services/leave-calculation.service.ts
export class LeaveCalculationService {
  calculateProration(joinDate: Date, leaveType: LeaveType): number
  calculateWorkingDays(start: Date, end: Date, holidays: Holiday[]): number
  canApproveLeave(balance: LeaveBalance, requestedDays: number): boolean
}
```

---

### B. APPLICATION LAYER

#### 1. **Thiếu Transaction Repository Interface**
```typescript
// application/ports/leave-balance-transaction.repository.interface.ts
export interface ILeaveBalanceTransactionRepository {
  create(transaction: LeaveBalanceTransactionEntity): Promise<LeaveBalanceTransactionEntity>;
  findByEmployee(employeeId: number, filters?: any): Promise<LeaveBalanceTransactionEntity[]>;
  findByLeaveRecord(leaveRecordId: number): Promise<LeaveBalanceTransactionEntity[]>;
}
```

#### 2. **Thiếu Use Cases**

##### **GET /leave-balances/me**
```typescript
// application/leave-balance/use-cases/get-my-balance.use-case.ts
export class GetMyBalanceUseCase {
  async execute(employeeId: number, year?: number): Promise<LeaveBalanceResponseDto[]>
}
```

##### **GET /leave-balances/transactions/me**
```typescript
// application/leave-balance/use-cases/get-my-transactions.use-case.ts
export class GetMyTransactionsUseCase {
  async execute(employeeId: number, filters?: any): Promise<TransactionResponseDto[]>
}
```

##### **GET /leave-balances/me/statistics**
```typescript
// application/leave-balance/use-cases/get-my-statistics.use-case.ts
export class GetMyStatisticsUseCase {
  async execute(employeeId: number, year: number): Promise<StatisticsResponseDto>
}
```

##### **POST /leave-balances/bulk-initialize**
```typescript
// application/leave-balance/use-cases/bulk-initialize-balances.use-case.ts
export class BulkInitializeBalancesUseCase {
  async execute(year: number, employeeIds: number[]): Promise<BulkResultDto>
}
```

#### 3. **Sửa các Use Cases hiện có để ghi Transaction**

**Files cần sửa**:
- ✅ `approve-leave.use-case.ts` - Thêm ghi transaction khi approve
- ✅ `reject-leave.use-case.ts` - Thêm ghi transaction khi reject
- ✅ `cancel-leave.use-case.ts` - Thêm ghi transaction khi cancel
- ✅ `create-leave-request.use-case.ts` - Thêm ghi transaction khi tạo (pending)
- ✅ `adjust-leave-balance.use-case.ts` - Đã có ghi transaction ✓

---

### C. PRESENTATION LAYER

#### **Thêm endpoints vào LeaveBalanceController**

```typescript
// presentation/controllers/leave-balance.controller.ts

@Get('me')
async getMyBalance(
  @CurrentUser() user: JwtPayload,
  @Query('year', new ParseIntPipe({ optional: true })) year?: number,
): Promise<ApiResponseDto<LeaveBalanceResponseDto[]>>

@Get('me/summary')
async getMySummary(
  @CurrentUser() user: JwtPayload,
  @Query('year', new ParseIntPipe({ optional: true })) year?: number,
): Promise<ApiResponseDto<LeaveBalanceSummaryDto>>

@Get('me/statistics')
async getMyStatistics(
  @CurrentUser() user: JwtPayload,
  @Query('year', new ParseIntPipe({ optional: true })) year?: number,
): Promise<ApiResponseDto<StatisticsResponseDto>>

@Get('transactions/me')
async getMyTransactions(
  @CurrentUser() user: JwtPayload,
  @Query() filters?: TransactionFilterDto,
): Promise<ApiResponseDto<TransactionResponseDto[]>>
```

---

### D. INFRASTRUCTURE LAYER

#### **Thêm Transaction Repository Implementation**
```typescript
// infrastructure/persistence/typeorm/leave-balance-transaction.repository.ts
export class LeaveBalanceTransactionRepository implements ILeaveBalanceTransactionRepository {
  // CRUD operations
}
```

---

## 🎯 TRANSACTION TYPES CẦN HỖ TRỢ

```typescript
enum TransactionType {
  INITIALIZATION = 'INITIALIZATION',     // Khởi tạo đầu năm
  ADJUSTMENT = 'ADJUSTMENT',             // Điều chỉnh thủ công
  CARRY_OVER = 'CARRY_OVER',             // Cộng dồn từ năm trước
  CARRY_OVER_EXPIRY = 'CARRY_OVER_EXPIRY', // Hết hạn phép cộng dồn
  LEAVE_PENDING = 'LEAVE_PENDING',       // Đơn tạo mới (pending)
  LEAVE_APPROVED = 'LEAVE_APPROVED',     // Đơn được duyệt
  LEAVE_REJECTED = 'LEAVE_REJECTED',     // Đơn bị từ chối
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',   // Đơn bị hủy
  ACCRUAL = 'ACCRUAL',                   // Tích lũy hàng tháng
  FORFEITURE = 'FORFEITURE',             // Mất phép (resign, etc)
}
```

---

## 📊 BUSINESS RULES CHECKLIST

### ✅ Đã implement:
- [x] Check overlapping leaves
- [x] Check sufficient balance
- [x] Deduct pending_days when create
- [x] Move pending → used when approve
- [x] Restore balance when reject/cancel
- [x] Carry-over logic
- [x] Proration for mid-year joiners
- [x] Exclude weekends/holidays

### ❌ Chưa implement:
- [ ] **Transaction logging** (CRITICAL)
- [ ] **Employee self-service endpoints** (`/me`)
- [ ] **Transaction history API**
- [ ] **Statistics/Analytics API**
- [ ] **Bulk operations**
- [ ] **Domain Events** (for notification)
- [ ] **Leave balance expiry notifications**
- [ ] **Auto-deduction for no-show**
- [ ] **Approval workflow** (multi-level)
- [ ] **Delegation** (người thay quyền approve)

---

## 🔧 NGUYÊN TẮC CLEAN ARCHITECTURE ĐÃ ÁP DỤNG

### ✅ GOOD:
1. **Dependency Rule**: Domain không phụ thuộc vào bất kỳ layer nào ✓
2. **Repository Pattern**: Interface ở Application, implement ở Infrastructure ✓
3. **Use Case Pattern**: Mỗi nghiệp vụ là 1 use case riêng ✓
4. **DTO Pattern**: Request/Response DTOs rõ ràng ✓
5. **Entity Schema tách biệt**: TypeORM schema không trộn vào entity ✓

### ⚠️ CẦN CẢI THIỆN:
1. **Domain Services**: Chưa có (nên tạo cho complex business logic)
2. **Value Objects**: Chưa có (nên dùng cho DateRange, Money, etc)
3. **Domain Events**: Chưa có (nên dùng để decouple services)
4. **Transaction Management**: Chưa có wrapper/decorator cho DB transactions
5. **Validation**: Nên tách validation logic ra domain layer

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: CRITICAL (Làm ngay) 🔴
1. ✅ Thêm endpoint `GET /leave-balances/me`
2. ✅ Implement Transaction Repository
3. ✅ Sửa Approve/Reject/Cancel Use Cases để ghi transaction
4. ✅ Thêm endpoint `GET /leave-balances/transactions/me`

### Phase 2: HIGH (Tuần tới) 🟠
5. ✅ Implement Statistics Use Case
6. ✅ Bulk Initialize Use Case
7. ✅ Domain Services (LeaveCalculationService)
8. ✅ Add proper DB Transaction management

### Phase 3: MEDIUM (Sprint sau) 🟡
9. ⏳ Domain Events
10. ⏳ Multi-level approval workflow
11. ⏳ Delegation feature
12. ⏳ Auto-expiry scheduled jobs

### Phase 4: LOW (Backlog) ⚪
13. ⏳ Value Objects refactoring
14. ⏳ Advanced analytics
15. ⏳ Leave forecasting
16. ⏳ Integration tests

---

## 📝 NOTES

- **Database đã đủ schema**, chỉ thiếu logic sử dụng transaction table
- **Clean Architecture structure tốt**, chỉ cần bổ sung use cases
- **Repository pattern đúng**, chỉ thiếu transaction repository
- **Cần thêm @CurrentUser decorator** trong controllers để lấy JWT payload
- **Swagger documentation** cần bổ sung cho các endpoint mới

---

## 🎓 CLEAN ARCHITECTURE BEST PRACTICES

### Dependency Flow:
```
Presentation → Application → Domain ← Infrastructure
     ↓              ↓           ↑           ↑
  DTOs         Use Cases    Entities   Repositories
                  ↓           ↑
              Interfaces  ← Implement
```

### Naming Conventions:
- Use Cases: `{Verb}{Entity}UseCase` (e.g., `GetMyBalanceUseCase`)
- DTOs: `{Entity}{Request|Response}Dto`
- Entities: `{Entity}Entity`
- Repositories: `I{Entity}Repository` (interface), `{Entity}Repository` (impl)
- Controllers: `{Entity}Controller`

---

**Tóm lại**: Service Leave đã có foundation tốt, nhưng thiếu:
1. Self-service endpoints cho employee
2. Transaction logging (audit trail)
3. Statistics & analytics
4. Domain events & services

Ưu tiên cao nhất: **Transaction logging** và **`/me` endpoints**.
