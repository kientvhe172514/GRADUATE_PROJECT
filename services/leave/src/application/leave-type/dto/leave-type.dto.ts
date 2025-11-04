import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsNumber, IsOptional, IsIn, Min, Max, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeaveTypeDto {
  @ApiProperty({
    description: 'Unique code for the leave type',
    example: 'ANNUAL',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z_]+$/, { message: 'Leave type code must be uppercase letters and underscores only' })
  leave_type_code: string;

  @ApiProperty({
    description: 'Display name of the leave type',
    example: 'Annual Leave',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  leave_type_name: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the leave type',
    example: 'Paid time off for vacation and personal matters',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Whether this leave type is paid',
    example: true,
    default: true,
  })
  @IsBoolean()
  is_paid: boolean;

  @ApiProperty({
    description: 'Whether this leave requires manager approval',
    example: true,
    default: true,
  })
  @IsBoolean()
  requires_approval: boolean;

  @ApiProperty({
    description: 'Whether supporting documents are required',
    example: false,
    default: false,
  })
  @IsBoolean()
  requires_document: boolean;

  @ApiProperty({
    description: 'Whether this leave deducts from employee balance',
    example: true,
    default: true,
  })
  @IsBoolean()
  deducts_from_balance: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days allowed per year',
    example: 15.5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  max_days_per_year?: number;

  @ApiPropertyOptional({
    description: 'Maximum consecutive days that can be taken',
    example: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  max_consecutive_days?: number;

  @ApiProperty({
    description: 'Minimum notice days required before leave start date',
    example: 7,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  min_notice_days: number;

  @ApiProperty({
    description: 'Whether to exclude public holidays from leave calculation',
    example: true,
    default: true,
  })
  @IsBoolean()
  exclude_holidays: boolean;

  @ApiProperty({
    description: 'Whether to exclude weekends from leave calculation',
    example: true,
    default: true,
  })
  @IsBoolean()
  exclude_weekends: boolean;

  @ApiProperty({
    description: 'Whether unused days can be carried over to next year',
    example: false,
    default: false,
  })
  @IsBoolean()
  allow_carry_over: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days that can be carried over',
    example: 5,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  max_carry_over_days?: number;

  @ApiProperty({
    description: 'Number of months before carried over days expire',
    example: 3,
    default: 3,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  carry_over_expiry_months: number;

  @ApiProperty({
    description: 'Whether leave entitlement is prorated for new joiners',
    example: true,
    default: true,
  })
  @IsBoolean()
  is_prorated: boolean;

  @ApiProperty({
    description: 'Basis for proration calculation',
    example: 'MONTHLY',
    enum: ['MONTHLY', 'DAILY'],
    default: 'MONTHLY',
  })
  @IsString()
  @IsIn(['MONTHLY', 'DAILY'])
  proration_basis: string;

  @ApiProperty({
    description: 'Whether leave accrues over time',
    example: false,
    default: false,
  })
  @IsBoolean()
  is_accrued: boolean;

  @ApiPropertyOptional({
    description: 'Accrual rate (days per month)',
    example: 1.25,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  accrual_rate?: number;

  @ApiProperty({
    description: 'Month when accrual starts (0-11, 0=January)',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(11)
  accrual_start_month: number;

  @ApiProperty({
    description: 'Hex color code for UI display',
    example: '#3B82F6',
    default: '#3B82F6',
  })
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Color must be a valid hex code (e.g., #3B82F6)' })
  color_hex: string;

  @ApiPropertyOptional({
    description: 'Icon name for UI display',
    example: 'calendar-check',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({
    description: 'Sort order for display',
    example: 1,
    default: 0,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sort_order: number;
}

export class UpdateLeaveTypeDto {
  @ApiPropertyOptional({
    description: 'Display name of the leave type',
    example: 'Annual Leave',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  leave_type_name?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the leave type',
    example: 'Paid time off for vacation and personal matters',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this leave type is paid',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this leave requires manager approval',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @ApiPropertyOptional({
    description: 'Whether supporting documents are required',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requires_document?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this leave deducts from employee balance',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  deducts_from_balance?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days allowed per year',
    example: 15.5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  max_days_per_year?: number;

  @ApiPropertyOptional({
    description: 'Maximum consecutive days that can be taken',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  max_consecutive_days?: number;

  @ApiPropertyOptional({
    description: 'Minimum notice days required',
    example: 7,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  min_notice_days?: number;

  @ApiPropertyOptional({
    description: 'Whether to exclude public holidays',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  exclude_holidays?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to exclude weekends',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  exclude_weekends?: boolean;

  @ApiPropertyOptional({
    description: 'Whether unused days can be carried over',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allow_carry_over?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum days that can be carried over',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  max_carry_over_days?: number;

  @ApiPropertyOptional({
    description: 'Number of months before carried over days expire',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  carry_over_expiry_months?: number;

  @ApiPropertyOptional({
    description: 'Whether leave entitlement is prorated',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_prorated?: boolean;

  @ApiPropertyOptional({
    description: 'Basis for proration calculation',
    example: 'MONTHLY',
    enum: ['MONTHLY', 'DAILY'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['MONTHLY', 'DAILY'])
  proration_basis?: string;

  @ApiPropertyOptional({
    description: 'Whether leave accrues over time',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  is_accrued?: boolean;

  @ApiPropertyOptional({
    description: 'Accrual rate (days per month)',
    example: 1.25,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  accrual_rate?: number;

  @ApiPropertyOptional({
    description: 'Month when accrual starts (0-11)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(11)
  accrual_start_month?: number;

  @ApiPropertyOptional({
    description: 'Hex color code for UI display',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-F]{6}$/i)
  color_hex?: string;

  @ApiPropertyOptional({
    description: 'Icon name for UI display',
    example: 'calendar-check',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  sort_order?: number;

  @ApiPropertyOptional({
    description: 'Leave type status',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class LeaveTypeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'ANNUAL' })
  leave_type_code: string;

  @ApiProperty({ example: 'Annual Leave' })
  leave_type_name: string;

  @ApiPropertyOptional({ example: 'Paid time off for vacation' })
  description?: string;

  @ApiProperty({ example: true })
  is_paid: boolean;

  @ApiProperty({ example: true })
  requires_approval: boolean;

  @ApiProperty({ example: false })
  requires_document: boolean;

  @ApiProperty({ example: true })
  deducts_from_balance: boolean;

  @ApiPropertyOptional({ example: 15 })
  max_days_per_year?: number;

  @ApiPropertyOptional({ example: 10 })
  max_consecutive_days?: number;

  @ApiProperty({ example: 7 })
  min_notice_days: number;

  @ApiProperty({ example: true })
  exclude_holidays: boolean;

  @ApiProperty({ example: true })
  exclude_weekends: boolean;

  @ApiProperty({ example: false })
  allow_carry_over: boolean;

  @ApiPropertyOptional({ example: 5 })
  max_carry_over_days?: number;

  @ApiProperty({ example: 3 })
  carry_over_expiry_months: number;

  @ApiProperty({ example: true })
  is_prorated: boolean;

  @ApiProperty({ example: 'MONTHLY' })
  proration_basis: string;

  @ApiProperty({ example: false })
  is_accrued: boolean;

  @ApiPropertyOptional({ example: 1.25 })
  accrual_rate?: number;

  @ApiProperty({ example: 0 })
  accrual_start_month: number;

  @ApiProperty({ example: '#3B82F6' })
  color_hex: string;

  @ApiPropertyOptional({ example: 'calendar-check' })
  icon?: string;

  @ApiProperty({ example: 0 })
  sort_order: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updated_at: Date;
}
