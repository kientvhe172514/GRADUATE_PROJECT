import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for Holiday
 */
export class HolidayResponseDto {
  @ApiProperty({ description: 'Holiday ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên ngày lễ', example: 'Ngày Quốc khánh' })
  holiday_name: string;

  @ApiProperty({ description: 'Ngày lễ', example: '2024-09-02' })
  holiday_date: Date;

  @ApiProperty({ description: 'Loại holiday', example: 'NATIONAL' })
  holiday_type: string;

  @ApiProperty({ description: 'Áp dụng cho', example: 'ALL' })
  applies_to: string;

  @ApiPropertyOptional({ description: 'Danh sách department IDs', example: '1,2,3' })
  department_ids?: string;

  @ApiPropertyOptional({ description: 'Danh sách location IDs', example: '1,2' })
  location_ids?: string;

  @ApiProperty({ description: 'Là ngày lễ lặp lại', example: false })
  is_recurring: boolean;

  @ApiPropertyOptional({ description: 'Tháng lặp lại', example: 9 })
  recurring_month?: number;

  @ApiPropertyOptional({ description: 'Ngày lặp lại', example: 2 })
  recurring_day?: number;

  @ApiPropertyOptional({ description: 'Quy tắc lặp lại', example: 'YEARLY' })
  recurring_rule?: string;

  @ApiProperty({ description: 'Bắt buộc nghỉ', example: true })
  is_mandatory: boolean;

  @ApiProperty({ description: 'Có lương', example: true })
  is_paid: boolean;

  @ApiProperty({ description: 'Có thể làm việc để tính OT', example: false })
  can_work_for_ot: boolean;

  @ApiPropertyOptional({ description: 'Mô tả', example: 'Ngày Quốc khánh Việt Nam' })
  description?: string;

  @ApiProperty({ description: 'Năm', example: 2024 })
  year: number;

  @ApiProperty({ description: 'Trạng thái', example: 'ACTIVE' })
  status: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
  created_at: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00Z' })
  updated_at: Date;
}

/**
 * Response DTO for Create Holiday (simplified version)
 */
export class CreateHolidayResponseDto {
  @ApiProperty({ description: 'Holiday ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên ngày lễ', example: 'Ngày Quốc khánh' })
  holiday_name: string;

  @ApiProperty({ description: 'Ngày lễ', example: '2024-09-02' })
  holiday_date: Date;

  @ApiProperty({ description: 'Loại holiday', example: 'NATIONAL' })
  holiday_type: string;

  @ApiProperty({ description: 'Trạng thái', example: 'ACTIVE' })
  status: string;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00Z' })
  created_at: Date;
}

/**
 * Response DTO for Calendar Holidays
 */
export class CalendarHolidayResponseDto {
  @ApiProperty({ description: 'Năm', example: 2024 })
  year: number;

  @ApiProperty({ type: [HolidayResponseDto], description: 'Danh sách holidays trong năm' })
  holidays: HolidayResponseDto[];
}

/**
 * Response DTO for Bulk Create Holidays
 */
export class BulkCreateHolidaysResponseDto {
  @ApiProperty({ description: 'Số lượng holidays đã tạo', example: 5 })
  created_count: number;

  @ApiProperty({ description: 'Số lượng holidays thất bại', example: 0 })
  failed_count: number;

  @ApiProperty({ type: [CreateHolidayResponseDto], description: 'Danh sách holidays đã tạo thành công' })
  created_holidays: CreateHolidayResponseDto[];

  @ApiPropertyOptional({ type: [String], description: 'Danh sách lỗi (nếu có)' })
  errors?: string[];
}

