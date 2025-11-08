import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GetBalanceQueryDto {
  @IsOptional()
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
  @IsInt()
  year?: number;
}

export class LeaveBalanceResponseDto {
  id: number;
  employee_id: number;
  leave_type_id: number;
  year: number;
  total_days: number;
  used_days: number;
  pending_days: number;
  remaining_days: number;
  carried_over_days: number;
  adjusted_days: number;
  created_at: Date;
  updated_at: Date;
}

export class LeaveBalanceSummaryDto {
  employee_id: number;
  year: number;
  total_entitled_days: number;
  total_used_days: number;
  total_pending_days: number;
  total_remaining_days: number;
  total_carried_over_days: number;
  total_adjusted_days: number;
}


