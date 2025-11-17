import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsDate,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ViolationType {
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  EARLY_LEAVE = 'EARLY_LEAVE',
  MISSING_CHECK_IN = 'MISSING_CHECK_IN',
  MISSING_CHECK_OUT = 'MISSING_CHECK_OUT',
  UNAUTHORIZED_ABSENCE = 'UNAUTHORIZED_ABSENCE',
  GPS_FRAUD = 'GPS_FRAUD',
  MULTIPLE_CHECK_IN = 'MULTIPLE_CHECK_IN',
  BUDDY_PUNCHING = 'BUDDY_PUNCHING',
}

export enum ViolationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateViolationDto {
  @ApiProperty({ example: 123, description: 'Employee ID' })
  @IsInt()
  employeeId: number;

  @ApiPropertyOptional({
    example: 456,
    description: 'Shift ID (if related to a shift)',
  })
  @IsOptional()
  @IsInt()
  shiftId?: number;

  @ApiProperty({ enum: ViolationType, example: ViolationType.LATE_ARRIVAL })
  @IsEnum(ViolationType)
  violationType: ViolationType;

  @ApiProperty({ enum: ViolationSeverity, example: ViolationSeverity.MEDIUM })
  @IsEnum(ViolationSeverity)
  severity: ViolationSeverity;

  @ApiPropertyOptional({
    example: 'Employee arrived 35 minutes late without prior approval',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: { lateMinutes: 35, checkInTime: '2024-01-15T08:35:00Z' },
    description: 'Evidence data in JSON format',
  })
  @IsOptional()
  @IsObject()
  evidenceData?: Record<string, any>;

  @ApiProperty({ example: '2024-01-15T08:35:00Z' })
  @Type(() => Date)
  @IsDate()
  detectedAt: Date;
}
