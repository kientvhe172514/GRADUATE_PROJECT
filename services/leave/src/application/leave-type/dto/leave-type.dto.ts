import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsInt, IsDecimal, Min, Max, Length, Matches, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class CreateLeaveTypeDto {
  @ApiProperty({ description: 'Leave type code (uppercase, unique)', example: 'MATERNITY', maxLength: 20 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  @Transform(({ value }) => value?.toUpperCase())
  @Matches(/^[A-Z0-9_]+$/, { message: 'Leave type code must be uppercase and contain only letters, numbers, and underscores' })
  leave_type_code: string;

  @ApiProperty({ description: 'Leave type name', example: 'Annual Leave', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  leave_type_name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Nghỉ phép năm có lương' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Is paid leave', example: true })
  @IsBoolean()
  is_paid: boolean;

  @ApiProperty({ description: 'Requires approval', example: true })
  @IsBoolean()
  requires_approval: boolean;

  @ApiProperty({ description: 'Requires document', example: false })
  @IsBoolean()
  requires_document: boolean;

  @ApiProperty({ description: 'Deducts from balance', example: true })
  @IsBoolean()
  deducts_from_balance: boolean;

  @ApiPropertyOptional({ description: 'Maximum days per year (must be > 0 if set)', example: 12 })
  @IsOptional()
  @IsNumber({}, { message: 'max_days_per_year must be a number' })
  @ValidateIf((o) => o.max_days_per_year !== undefined && o.max_days_per_year !== null)
  @Min(0.01, { message: 'max_days_per_year must be greater than 0 if set' })
  max_days_per_year?: number;

  @ApiPropertyOptional({ description: 'Maximum consecutive days', example: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  max_consecutive_days?: number;

  @ApiProperty({ description: 'Minimum notice days', example: 3 })
  @IsInt()
  @Min(0)
  min_notice_days: number;

  @ApiProperty({ description: 'Exclude holidays', example: true })
  @IsBoolean()
  exclude_holidays: boolean;

  @ApiProperty({ description: 'Exclude weekends', example: true })
  @IsBoolean()
  exclude_weekends: boolean;

  @ApiProperty({ description: 'Allow carry over', example: true })
  @IsBoolean()
  allow_carry_over: boolean;

  @ApiPropertyOptional({ description: 'Maximum carry over days', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_carry_over_days?: number;

  @ApiProperty({ description: 'Carry over expiry months', example: 3 })
  @IsInt()
  @Min(0)
  carry_over_expiry_months: number;

  @ApiProperty({ description: 'Is prorated', example: true })
  @IsBoolean()
  is_prorated: boolean;

  @ApiProperty({ description: 'Proration basis', example: 'MONTHLY' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  proration_basis: string;

  @ApiProperty({ description: 'Is accrued', example: false })
  @IsBoolean()
  is_accrued: boolean;

  @ApiPropertyOptional({ description: 'Accrual rate', example: null })
  @IsNumber()
  @IsOptional()
  @Min(0)
  accrual_rate?: number;

  @ApiProperty({ description: 'Accrual start month (0-11)', example: 0 })
  @IsInt()
  @Min(0)
  @Max(11)
  accrual_start_month: number;

  @ApiProperty({ description: 'Color hex code', example: '#3B82F6' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color code' })
  color_hex: string;

  @ApiPropertyOptional({ description: 'Icon', example: null, maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  icon?: string;

  @ApiProperty({ description: 'Sort order', example: 1 })
  @IsInt()
  sort_order: number;

  @ApiPropertyOptional({ description: 'Status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsString()
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'], { message: 'Status must be either ACTIVE or INACTIVE' })
  status?: string;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({ description: 'Leave type name', example: 'Annual Leave', maxLength: 255 })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  leave_type_name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Nghỉ phép năm có lương' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Is paid leave', example: true })
  @IsBoolean()
  @IsOptional()
  is_paid?: boolean;

  @ApiPropertyOptional({ description: 'Requires approval', example: true })
  @IsBoolean()
  @IsOptional()
  requires_approval?: boolean;

  @ApiPropertyOptional({ description: 'Requires document', example: false })
  @IsBoolean()
  @IsOptional()
  requires_document?: boolean;

  @ApiPropertyOptional({ description: 'Deducts from balance', example: true })
  @IsBoolean()
  @IsOptional()
  deducts_from_balance?: boolean;

  @ApiPropertyOptional({ description: 'Maximum days per year', example: 12 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_days_per_year?: number;

  @ApiPropertyOptional({ description: 'Maximum consecutive days', example: 10 })
  @IsInt()
  @IsOptional()
  @Min(1)
  max_consecutive_days?: number;

  @ApiPropertyOptional({ description: 'Minimum notice days', example: 3 })
  @IsInt()
  @IsOptional()
  @Min(0)
  min_notice_days?: number;

  @ApiPropertyOptional({ description: 'Exclude holidays', example: true })
  @IsBoolean()
  @IsOptional()
  exclude_holidays?: boolean;

  @ApiPropertyOptional({ description: 'Exclude weekends', example: true })
  @IsBoolean()
  @IsOptional()
  exclude_weekends?: boolean;

  @ApiPropertyOptional({ description: 'Allow carry over', example: true })
  @IsBoolean()
  @IsOptional()
  allow_carry_over?: boolean;

  @ApiPropertyOptional({ description: 'Maximum carry over days', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  max_carry_over_days?: number;

  @ApiPropertyOptional({ description: 'Carry over expiry months', example: 3 })
  @IsInt()
  @IsOptional()
  @Min(0)
  carry_over_expiry_months?: number;

  @ApiPropertyOptional({ description: 'Is prorated', example: true })
  @IsBoolean()
  @IsOptional()
  is_prorated?: boolean;

  @ApiPropertyOptional({ description: 'Proration basis', example: 'MONTHLY' })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  proration_basis?: string;

  @ApiPropertyOptional({ description: 'Is accrued', example: false })
  @IsBoolean()
  @IsOptional()
  is_accrued?: boolean;

  @ApiPropertyOptional({ description: 'Accrual rate', example: null })
  @IsNumber()
  @IsOptional()
  @Min(0)
  accrual_rate?: number;

  @ApiPropertyOptional({ description: 'Accrual start month (0-11)', example: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(11)
  accrual_start_month?: number;

  @ApiPropertyOptional({ description: 'Color hex code', example: '#3B82F6' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color code' })
  color_hex?: string;

  @ApiPropertyOptional({ description: 'Icon', example: null, maxLength: 50 })
  @IsString()
  @IsOptional()
  @Length(0, 50)
  icon?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 1 })
  @IsInt()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ description: 'Status', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'] })
  @IsString()
  @IsOptional()
  status?: string;
}
