import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  Length,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateHolidayDto {
  @ApiProperty({ description: 'Tên ngày lễ', example: 'Ngày Quốc khánh', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  holiday_name: string;

  @ApiProperty({ description: 'Ngày lễ (YYYY-MM-DD)', example: '2024-09-02' })
  @IsDateString()
  @IsNotEmpty()
  holiday_date: string;

  @ApiProperty({ description: 'Loại holiday', example: 'NATIONAL', enum: ['NATIONAL', 'RELIGIOUS', 'COMPANY', 'REGIONAL'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['NATIONAL', 'RELIGIOUS', 'COMPANY', 'REGIONAL'], { message: 'holiday_type must be one of: NATIONAL, RELIGIOUS, COMPANY, REGIONAL' })
  holiday_type: string;

  @ApiPropertyOptional({ description: 'Áp dụng cho', example: 'ALL', enum: ['ALL', 'DEPARTMENT', 'LOCATION'], default: 'ALL' })
  @IsString()
  @IsOptional()
  @IsIn(['ALL', 'DEPARTMENT', 'LOCATION'], { message: 'applies_to must be one of: ALL, DEPARTMENT, LOCATION' })
  applies_to?: string;

  @ApiPropertyOptional({ description: 'Danh sách department IDs (comma-separated)', example: '1,2,3' })
  @IsString()
  @IsOptional()
  department_ids?: string;

  @ApiPropertyOptional({ description: 'Danh sách location IDs (comma-separated)', example: '1,2' })
  @IsString()
  @IsOptional()
  location_ids?: string;

  @ApiPropertyOptional({ description: 'Là ngày lễ lặp lại hàng năm', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;

  @ApiPropertyOptional({ description: 'Tháng lặp lại (1-12)', example: 9 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  recurring_month?: number;

  @ApiPropertyOptional({ description: 'Ngày lặp lại (1-31)', example: 2 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  recurring_day?: number;

  @ApiPropertyOptional({ description: 'Quy tắc lặp lại', example: 'YEARLY', maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  recurring_rule?: string;

  @ApiPropertyOptional({ description: 'Bắt buộc nghỉ', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @ApiPropertyOptional({ description: 'Có lương', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  is_paid?: boolean;

  @ApiPropertyOptional({ description: 'Có thể làm việc để tính OT', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  can_work_for_ot?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả', example: 'Ngày Quốc khánh Việt Nam' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Năm', example: 2024 })
  @IsInt()
  @Min(1900)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ description: 'Trạng thái', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'status must be either ACTIVE or INACTIVE' })
  status?: string;
}

export class UpdateHolidayDto {
  @ApiPropertyOptional({ description: 'Tên ngày lễ', example: 'Ngày Quốc khánh', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  holiday_name?: string;

  @ApiPropertyOptional({ description: 'Ngày lễ (YYYY-MM-DD)', example: '2024-09-02' })
  @IsDateString()
  @IsOptional()
  holiday_date?: string;

  @ApiPropertyOptional({ description: 'Loại holiday', example: 'NATIONAL', enum: ['NATIONAL', 'RELIGIOUS', 'COMPANY', 'REGIONAL'] })
  @IsString()
  @IsOptional()
  @IsIn(['NATIONAL', 'RELIGIOUS', 'COMPANY', 'REGIONAL'], { message: 'holiday_type must be one of: NATIONAL, RELIGIOUS, COMPANY, REGIONAL' })
  holiday_type?: string;

  @ApiPropertyOptional({ description: 'Áp dụng cho', example: 'ALL', enum: ['ALL', 'DEPARTMENT', 'LOCATION'] })
  @IsString()
  @IsOptional()
  @IsIn(['ALL', 'DEPARTMENT', 'LOCATION'], { message: 'applies_to must be one of: ALL, DEPARTMENT, LOCATION' })
  applies_to?: string;

  @ApiPropertyOptional({ description: 'Danh sách department IDs (comma-separated)', example: '1,2,3' })
  @IsString()
  @IsOptional()
  department_ids?: string;

  @ApiPropertyOptional({ description: 'Danh sách location IDs (comma-separated)', example: '1,2' })
  @IsString()
  @IsOptional()
  location_ids?: string;

  @ApiPropertyOptional({ description: 'Là ngày lễ lặp lại hàng năm', example: false })
  @IsBoolean()
  @IsOptional()
  is_recurring?: boolean;

  @ApiPropertyOptional({ description: 'Tháng lặp lại (1-12)', example: 9 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(12)
  recurring_month?: number;

  @ApiPropertyOptional({ description: 'Ngày lặp lại (1-31)', example: 2 })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(31)
  recurring_day?: number;

  @ApiPropertyOptional({ description: 'Quy tắc lặp lại', example: 'YEARLY', maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  recurring_rule?: string;

  @ApiPropertyOptional({ description: 'Bắt buộc nghỉ', example: true })
  @IsBoolean()
  @IsOptional()
  is_mandatory?: boolean;

  @ApiPropertyOptional({ description: 'Có lương', example: true })
  @IsBoolean()
  @IsOptional()
  is_paid?: boolean;

  @ApiPropertyOptional({ description: 'Có thể làm việc để tính OT', example: false })
  @IsBoolean()
  @IsOptional()
  can_work_for_ot?: boolean;

  @ApiPropertyOptional({ description: 'Mô tả', example: 'Ngày Quốc khánh Việt Nam' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Năm', example: 2024 })
  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Trạng thái', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'status must be either ACTIVE or INACTIVE' })
  status?: string;
}

export class BulkCreateHolidaysDto {
  @ApiProperty({ description: 'Danh sách holidays cần tạo', type: [CreateHolidayDto] })
  @IsNotEmpty()
  holidays: CreateHolidayDto[];
}

