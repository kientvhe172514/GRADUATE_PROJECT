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


