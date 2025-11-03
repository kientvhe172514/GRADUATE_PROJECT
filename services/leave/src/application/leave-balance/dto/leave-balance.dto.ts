import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLeaveBalanceQueryDto {
  @ApiPropertyOptional({
    description: 'Year to query balances for',
    example: 2025,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(2000)
  year?: number;
}

export class LeaveBalanceSummaryDto {
  @ApiProperty({ example: 1001 })
  employee_id: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        leave_type_id: { type: 'number', example: 1 },
        leave_type_name: { type: 'string', example: 'Annual Leave' },
        leave_type_code: { type: 'string', example: 'ANNUAL' },
        total_days: { type: 'number', example: 15 },
        used_days: { type: 'number', example: 5 },
        pending_days: { type: 'number', example: 2 },
        remaining_days: { type: 'number', example: 8 },
        carried_over_days: { type: 'number', example: 0 },
        adjusted_days: { type: 'number', example: 0 },
      },
    },
  })
  balances: Array<{
    leave_type_id: number;
    leave_type_name: string;
    leave_type_code: string;
    total_days: number;
    used_days: number;
    pending_days: number;
    remaining_days: number;
    carried_over_days: number;
    adjusted_days: number;
  }>;

  @ApiProperty({ example: 15 })
  total_allocated: number;

  @ApiProperty({ example: 5 })
  total_used: number;

  @ApiProperty({ example: 10 })
  total_remaining: number;
}

export class InitializeLeaveBalanceDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 1001,
  })
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @ApiProperty({
    description: 'Employee employment start date',
    example: '2025-06-01',
  })
  @IsDateString()
  employment_start_date: Date;

  @ApiPropertyOptional({
    description: 'Year to initialize balances for (defaults to current year)',
    example: 2025,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(2000)
  year?: number;
}

export class AdjustLeaveBalanceDto {
  @ApiProperty({
    description: 'Employee ID',
    example: 1001,
  })
  @IsNumber()
  @Type(() => Number)
  employee_id: number;

  @ApiProperty({
    description: 'Leave type ID',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  leave_type_id: number;

  @ApiProperty({
    description: 'Year',
    example: 2025,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(2000)
  year: number;

  @ApiProperty({
    description: 'Number of days to adjust (positive to add, negative to deduct)',
    example: 5,
  })
  @IsNumber()
  @Type(() => Number)
  adjustment_days: number;

  @ApiProperty({
    description: 'Reason for adjustment',
    example: 'Bonus leave for exceptional performance',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'ID of user making the adjustment',
    example: 2001,
  })
  @IsNumber()
  @Type(() => Number)
  adjusted_by: number;
}

export class CarryOverLeaveBalanceDto {
  @ApiPropertyOptional({
    description: 'Employee ID (if not provided, will process for all employees)',
    example: 1001,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employee_id?: number;

  @ApiProperty({
    description: 'Year to carry over from',
    example: 2024,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(2000)
  from_year: number;

  @ApiProperty({
    description: 'Year to carry over to',
    example: 2025,
  })
  @IsNumber()
  @Type(() => Number)
  @Min(2000)
  to_year: number;
}
