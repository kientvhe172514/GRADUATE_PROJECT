import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetBalanceQueryDto {
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  year?: number;
}

export class InitializeLeaveBalancesDto {
  @IsInt()
  @Min(1)
  employee_id: number;

  @IsInt()
  year: number;
}

export class AdjustLeaveBalanceDto {
  @IsInt()
  @Min(1)
  employee_id: number;

  @IsInt()
  @Min(1)
  leave_type_id: number;

  @IsInt()
  year: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  adjustment: number; // positive or negative

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  created_by?: number;
}

export class CarryOverDto {
  @IsInt()
  year: number; // carry from year to year+1
}

export class ExpiringCarryOverQueryDto {
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  year?: number;
}

export class LeaveBalanceResponseDto {
  @Transform(({ value }) => Number(value))
  id: number;

  @Transform(({ value }) => Number(value))
  employee_id: number;

  @Transform(({ value }) => Number(value))
  leave_type_id: number;

  @Transform(({ value }) => Number(value))
  year: number;

  @Transform(({ value }) => Number(value))
  total_days: number;

  @Transform(({ value }) => Number(value))
  used_days: number;

  @Transform(({ value }) => Number(value))
  pending_days: number;

  @Transform(({ value }) => Number(value))
  remaining_days: number;

  @Transform(({ value }) => Number(value))
  carried_over_days: number;

  @Transform(({ value }) => Number(value))
  adjusted_days: number;

  created_at: Date;
  updated_at: Date;
}

export class LeaveBalanceSummaryDto {
  @Transform(({ value }) => Number(value))
  employee_id: number;

  @Transform(({ value }) => Number(value))
  year: number;

  @Transform(({ value }) => Number(value))
  total_entitled_days: number;

  @Transform(({ value }) => Number(value))
  total_used_days: number;

  @Transform(({ value }) => Number(value))
  total_pending_days: number;

  @Transform(({ value }) => Number(value))
  total_remaining_days: number;

  @Transform(({ value }) => Number(value))
  total_carried_over_days: number;

  @Transform(({ value }) => Number(value))
  total_adjusted_days: number;
}

// ========== TRANSACTION DTOs ==========

export class GetMyTransactionsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  year?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  @Min(1)
  leave_type_id?: number;

  @IsOptional()
  @IsString()
  transaction_type?: string; // INITIALIZATION, ADJUSTMENT, LEAVE_APPROVED, etc.

  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value, 10) : undefined)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class LeaveBalanceTransactionResponseDto {
  @Transform(({ value }) => Number(value))
  id: number;

  @Transform(({ value }) => Number(value))
  employee_id: number;

  @Transform(({ value }) => Number(value))
  leave_type_id: number;

  @Transform(({ value }) => Number(value))
  year: number;

  transaction_type: string;

  @Transform(({ value }) => Number(value))
  amount: number;

  @Transform(({ value }) => Number(value))
  balance_before: number;

  @Transform(({ value }) => Number(value))
  balance_after: number;

  reference_type?: string;

  @Transform(({ value }) => value ? Number(value) : undefined)
  reference_id?: number;

  description?: string;

  @Transform(({ value }) => value ? Number(value) : undefined)
  created_by?: number;

  created_at: Date;
}

// ========== STATISTICS DTOs ==========

export class LeaveBalanceStatisticsResponseDto {
  @Transform(({ value }) => Number(value))
  employee_id: number;

  @Transform(({ value }) => Number(value))
  year: number;

  // Overall statistics
  @Transform(({ value }) => Number(value))
  total_entitled: number;

  @Transform(({ value }) => Number(value))
  total_used: number;

  @Transform(({ value }) => Number(value))
  total_pending: number;

  @Transform(({ value }) => Number(value))
  total_remaining: number;

  @Transform(({ value }) => Number(value))
  total_carried_over: number;

  @Transform(({ value }) => Number(value))
  total_adjusted: number;

  // Usage rate
  @Transform(({ value }) => Number(value))
  usage_rate: number; // percentage (used / entitled * 100)

  // By leave type breakdown
  by_type: LeaveBalanceByTypeDto[];

  // Recent transactions
  recent_transactions: LeaveBalanceTransactionResponseDto[];
}

export class LeaveBalanceByTypeDto {
  @Transform(({ value }) => Number(value))
  leave_type_id: number;

  leave_type_name: string;

  leave_type_code: string;

  @Transform(({ value }) => Number(value))
  entitled: number;

  @Transform(({ value }) => Number(value))
  used: number;

  @Transform(({ value }) => Number(value))
  pending: number;

  @Transform(({ value }) => Number(value))
  remaining: number;

  @Transform(({ value }) => Number(value))
  carried_over: number;

  @Transform(({ value }) => Number(value))
  adjusted: number;
}


