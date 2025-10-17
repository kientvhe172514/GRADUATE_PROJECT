# Shared Common Module

Module chung cung cấp các tiện ích, DTOs, exceptions và filters cho tất cả services trong dự án Graduate Project.

## 🚀 Tính năng chính

- **📋 Common Response Structure**: Format response API chuẩn hóa
- **🔢 Error Code System**: Hệ thống mã lỗi chi tiết với thông báo rõ ràng
- **⚠️ Business Exceptions**: Xử lý exception tùy chỉnh với error codes
- **🛡️ Global Exception Filter**: Tự động xử lý lỗi và ghi log
- **🔄 Response Interceptor**: Tự động wrap response thành công

## 📖 Hướng dẫn sử dụng

### 1. Cài đặt trong Service Module

Thêm Global Exception Filter và Response Interceptor vào module của service:

```typescript
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from '../../../shared/src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../../../shared/src/common/interceptors/response.interceptor';

@Module({
  providers: [
    // ... other providers
    
    // Global Exception Filter - Tự động xử lý tất cả lỗi
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    
    // Response Interceptor - Tự động wrap response thành công
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class YourServiceModule {}
```

### 2. Sử dụng BusinessException trong Use Cases

Thay vì throw Error thông thường, sử dụng BusinessException với error codes:

```typescript
import { Injectable } from '@nestjs/common';
import { BusinessException } from '../../../shared/src/common/exceptions/business.exception';
import { ErrorCodes } from '../../../shared/src/common/enums/error-codes.enum';

@Injectable()
export class YourUseCase {
  async execute(data: any) {
    // Kiểm tra điều kiện business
    const existing = await this.repository.findByCode(data.code);
    if (existing) {
      throw new BusinessException(
        ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS,  // Mã lỗi
        `Employee code '${data.code}' already exists`,  // Thông báo lỗi
        HttpStatus.BAD_REQUEST,  // HTTP status code
        `Employee with code ${data.code} is already registered`  // Chi tiết lỗi
      );
    }

    // Xử lý logic khác...
  }
}
```

### 3. Cập nhật Controllers với ApiResponseDto

Cập nhật Swagger documentation để hiển thị đúng response format:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../shared/src/common/dto/api-response.dto';

@ApiTags('your-service')
@Controller('your-endpoint')
export class YourController {
  
  @Post()
  @ApiOperation({ summary: 'Tạo mới resource' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo thành công',
    type: ApiResponseDto<YourDataType>  // Response thành công
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu không hợp lệ',
    type: ApiResponseDto  // Response lỗi
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server',
    type: ApiResponseDto
  })
  async create(@Body() dto: CreateDto) {
    return this.useCase.execute(dto);
  }
}
```

### 4. Xử lý Validation Errors

Sử dụng class-validator với error codes tùy chỉnh:

```typescript
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'EMP001' })
  @IsNotEmpty({ message: 'Employee code is required' })
  @IsString({ message: 'Employee code must be a string' })
  employee_code: string;

  @ApiProperty({ example: 'user@company.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
```

## 📋 Format Response

### ✅ Response Thành Công

```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    "id": 1,
    "employee_code": "EMP001",
    "full_name": "Nguyễn Văn A",
    "email": "a@company.com"
  },
  "timestamp": "2025-01-17T09:58:14.000Z",
  "path": "/api/employees"
}
```

### ❌ Response Lỗi

```json
{
  "status": "ERROR",
  "statusCode": 400,
  "message": "Employee code 'EMP001' already exists",
  "errorCode": "EMPLOYEE_CODE_ALREADY_EXISTS",
  "errorDetails": "Employee with code EMP001 is already registered",
  "timestamp": "2025-01-17T09:58:14.000Z",
  "path": "/api/employees"
}
```

## 🔢 Danh sách Error Codes

### General Errors
- `VALIDATION_ERROR` - Lỗi validation dữ liệu
- `UNAUTHORIZED` - Không có quyền truy cập
- `FORBIDDEN` - Bị cấm truy cập
- `NOT_FOUND` - Không tìm thấy resource
- `CONFLICT` - Xung đột dữ liệu
- `BAD_REQUEST` - Yêu cầu không hợp lệ

### Auth Service Errors
- `ACCOUNT_ALREADY_EXISTS` - Tài khoản đã tồn tại
- `ACCOUNT_NOT_FOUND` - Không tìm thấy tài khoản
- `INVALID_CREDENTIALS` - Thông tin đăng nhập không đúng
- `ACCOUNT_LOCKED` - Tài khoản bị khóa
- `TOKEN_EXPIRED` - Token đã hết hạn
- `TOKEN_INVALID` - Token không hợp lệ

### Employee Service Errors
- `EMPLOYEE_ALREADY_EXISTS` - Nhân viên đã tồn tại
- `EMPLOYEE_NOT_FOUND` - Không tìm thấy nhân viên
- `EMPLOYEE_CODE_ALREADY_EXISTS` - Mã nhân viên đã tồn tại
- `EMPLOYEE_EMAIL_ALREADY_EXISTS` - Email nhân viên đã tồn tại
- `DEPARTMENT_NOT_FOUND` - Không tìm thấy phòng ban
- `POSITION_NOT_FOUND` - Không tìm thấy vị trí

### Notification Service Errors
- `NOTIFICATION_NOT_FOUND` - Không tìm thấy thông báo
- `NOTIFICATION_TEMPLATE_NOT_FOUND` - Không tìm thấy template
- `INVALID_NOTIFICATION_CHANNEL` - Kênh thông báo không hợp lệ
- `EMAIL_SERVICE_UNAVAILABLE` - Dịch vụ email không khả dụng
- `SMS_SERVICE_UNAVAILABLE` - Dịch vụ SMS không khả dụng
- `PUSH_SERVICE_UNAVAILABLE` - Dịch vụ push notification không khả dụng

### Database Errors
- `DATABASE_CONNECTION_ERROR` - Lỗi kết nối database
- `DATABASE_QUERY_ERROR` - Lỗi truy vấn database
- `DATABASE_CONSTRAINT_VIOLATION` - Vi phạm ràng buộc database

## 🛠️ Cài đặt và Build

### Cài đặt dependencies
```bash
cd services/shared
npm install
```

### Build module
```bash
npm run build
```

### Development mode (watch)
```bash
npm run dev
```

## 📝 Ví dụ thực tế

### Use Case với Error Handling
```typescript
@Injectable()
export class CreateEmployeeUseCase {
  async execute(dto: CreateEmployeeDto): Promise<Employee> {
    // Kiểm tra mã nhân viên trùng lặp
    const existingByCode = await this.employeeRepository.findByCode(dto.employee_code);
    if (existingByCode) {
      throw new BusinessException(
        ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS,
        `Employee code '${dto.employee_code}' already exists`,
        HttpStatus.BAD_REQUEST,
        `Employee with code ${dto.employee_code} is already registered`
      );
    }

    // Kiểm tra email trùng lặp
    const existingByEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new BusinessException(
        ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS,
        `Employee email '${dto.email}' already exists`,
        HttpStatus.BAD_REQUEST,
        `Employee with email ${dto.email} is already registered`
      );
    }

    // Tạo nhân viên mới
    const employee = new Employee();
    Object.assign(employee, dto);
    employee.full_name = `${dto.first_name} ${dto.last_name}`;

    return await this.employeeRepository.create(employee);
  }
}
```

### Controller với Response Documentation
```typescript
@Controller('employees')
export class EmployeeController {
  
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo nhân viên mới' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tạo nhân viên thành công',
    type: ApiResponseDto<CreateEmployeeResponseDto>
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu không hợp lệ hoặc trùng lặp',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Lỗi server',
    type: ApiResponseDto
  })
  async create(@Body() dto: CreateEmployeeDto): Promise<CreateEmployeeResponseDto> {
    return this.createEmployeeUseCase.execute(dto);
  }
}
```

## 🎯 Lợi ích

- **🔍 Dễ Debug**: Mỗi lỗi có mã lỗi và chi tiết cụ thể
- **📱 Frontend Friendly**: Format response nhất quán, dễ xử lý
- **🛡️ Security**: Không expose thông tin nhạy cảm trong error messages
- **📊 Monitoring**: Dễ dàng theo dõi và phân tích lỗi
- **🔄 Maintainable**: Code dễ bảo trì và mở rộng
- **📚 Documentation**: Swagger docs tự động cập nhật với response format mới