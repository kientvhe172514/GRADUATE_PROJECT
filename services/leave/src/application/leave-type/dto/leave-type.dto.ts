import { IsBoolean, IsEnum, IsHexColor, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, Matches, Max, Min } from 'class-validator';

export enum LeaveTypeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProrationBasis {
  MONTHLY = 'MONTHLY',
  DAILY = 'DAILY',
  YEARLY = 'YEARLY',
}

export class CreateLeaveTypeDto {
  @IsString()
  @Matches(/^[A-Z0-9_]{2,20}$/)
  leave_type_code: string;

  @IsString()
  @Length(1, 255)
  leave_type_name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  is_paid: boolean;

  @IsBoolean()
  requires_approval: boolean;

  @IsBoolean()
  requires_document: boolean;

  @IsBoolean()
  deducts_from_balance: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  max_days_per_year?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  max_consecutive_days?: number;

  @IsInt()
  @Min(0)
  min_notice_days: number;

  @IsBoolean()
  exclude_holidays: boolean;

  @IsBoolean()
  exclude_weekends: boolean;

  @IsBoolean()
  allow_carry_over: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  max_carry_over_days?: number;

  @IsInt()
  @Min(0)
  carry_over_expiry_months: number;

  @IsBoolean()
  is_prorated: boolean;

  @IsEnum(ProrationBasis)
  proration_basis: ProrationBasis;

  @IsBoolean()
  is_accrued: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  accrual_rate?: number;

  @IsInt()
  @Min(0)
  @Max(12)
  accrual_start_month: number;

  @IsHexColor()
  color_hex: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsInt()
  @Min(0)
  sort_order: number;
}

export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  leave_type_name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  @IsOptional()
  @IsBoolean()
  requires_document?: boolean;

  @IsOptional()
  @IsBoolean()
  deducts_from_balance?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  max_days_per_year?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  max_consecutive_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  min_notice_days?: number;

  @IsOptional()
  @IsBoolean()
  exclude_holidays?: boolean;

  @IsOptional()
  @IsBoolean()
  exclude_weekends?: boolean;

  @IsOptional()
  @IsBoolean()
  allow_carry_over?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  max_carry_over_days?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  carry_over_expiry_months?: number;

  @IsOptional()
  @IsEnum(ProrationBasis)
  proration_basis?: ProrationBasis;

  @IsOptional()
  @IsBoolean()
  is_prorated?: boolean;

  @IsOptional()
  @IsBoolean()
  is_accrued?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  accrual_rate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(12)
  accrual_start_month?: number;

  @IsOptional()
  @IsHexColor()
  color_hex?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;

  @IsOptional()
  @IsEnum(LeaveTypeStatus)
  status?: LeaveTypeStatus;
}

export class ListLeaveTypesQueryDto {
  @IsOptional()
  @IsEnum(LeaveTypeStatus)
  status?: LeaveTypeStatus;

  @IsOptional()
  @IsBoolean()
  is_paid?: boolean;
}

export class LeaveTypeResponseDto {
  id: number;
  leave_type_code: string;
  leave_type_name: string;
  description?: string;
  is_paid: boolean;
  requires_approval: boolean;
  requires_document: boolean;
  deducts_from_balance: boolean;
  max_days_per_year?: number;
  max_consecutive_days?: number;
  min_notice_days: number;
  exclude_holidays: boolean;
  exclude_weekends: boolean;
  allow_carry_over: boolean;
  max_carry_over_days?: number;
  carry_over_expiry_months: number;
  is_prorated: boolean;
  proration_basis: ProrationBasis | string;
  is_accrued: boolean;
  accrual_rate?: number;
  accrual_start_month: number;
  color_hex: string;
  icon?: string;
  sort_order: number;
  status: LeaveTypeStatus | string;
  created_at: Date;
  updated_at: Date;
}
