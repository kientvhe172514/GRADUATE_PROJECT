import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ViolationType {
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  ABSENT = 'ABSENT',
  GPS_FRAUD = 'GPS_FRAUD',
  MISSING_CHECK_IN = 'MISSING_CHECK_IN',
  MISSING_CHECK_OUT = 'MISSING_CHECK_OUT',
}

export enum ViolationSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class ResolveViolationDto {
  @ApiProperty({ example: 'Approved due to emergency' })
  @IsString()
  resolution_notes: string;
}

export class ViolationQueryDto {
  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({ enum: ViolationType })
  @IsOptional()
  @IsEnum(ViolationType)
  violation_type?: string;

  @ApiPropertyOptional({ enum: ViolationSeverity })
  @IsOptional()
  @IsEnum(ViolationSeverity)
  severity?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  resolved?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  unresolved_only?: boolean;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
