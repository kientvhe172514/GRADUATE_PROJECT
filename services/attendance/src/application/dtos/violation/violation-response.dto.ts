import {
  IsInt,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ViolationStatus {
  PENDING = 'PENDING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
}

export class GetViolationsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 123, description: 'Filter by employee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({
    enum: ViolationType,
    description: 'Filter by violation type',
  })
  @IsOptional()
  @IsEnum(ViolationType)
  violationType?: string;

  @ApiPropertyOptional({
    enum: ViolationSeverity,
    description: 'Filter by severity',
  })
  @IsOptional()
  @IsEnum(ViolationSeverity)
  severity?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Show only unresolved violations',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unresolvedOnly?: boolean;
}

export class ResolveViolationDto {
  @ApiProperty({
    example: 'Approved late arrival due to traffic accident with police report',
  })
  @IsString()
  resolutionNotes: string;

  @ApiPropertyOptional({ example: true, description: 'Mark as resolved' })
  @IsOptional()
  @IsBoolean()
  resolved?: boolean = true;
}

export class DisputeViolationDto {
  @ApiProperty({
    example: 'I was delayed due to a car accident. Attaching police report.',
  })
  @IsString()
  explanation: string;
}

export class ViolationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  employeeId: number;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  employeeName: string;

  @ApiProperty()
  shiftId?: number;

  @ApiProperty({ enum: ViolationType })
  violationType: string;

  @ApiProperty({ enum: ViolationSeverity })
  severity: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  evidenceData?: Record<string, any>;

  @ApiProperty()
  detectedAt: Date;

  @ApiProperty()
  resolved: boolean;

  @ApiProperty()
  resolvedBy?: number;

  @ApiProperty()
  resolvedAt?: Date;

  @ApiProperty()
  resolutionNotes?: string;

  @ApiProperty()
  createdAt: Date;
}

export class ViolationStatisticsDto {
  @ApiProperty()
  totalViolations: number;

  @ApiProperty()
  unresolvedViolations: number;

  @ApiProperty()
  byType: Array<{ type: string; count: number }>;

  @ApiProperty()
  bySeverity: Array<{ severity: string; count: number }>;

  @ApiProperty()
  topViolators: Array<{
    employeeId: number;
    employeeCode: string;
    employeeName: string;
    violationCount: number;
  }>;
}

import { ViolationType, ViolationSeverity } from './create-violation.dto';
