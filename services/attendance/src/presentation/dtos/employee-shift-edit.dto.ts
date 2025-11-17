import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ShiftStatus } from '../../domain/entities/employee-shift.entity';

export class ManualEditShiftDto {
  @ApiPropertyOptional({
    example: '2025-01-01T08:30:00.000Z',
    description: 'New check-in time (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  check_in_time?: string;

  @ApiPropertyOptional({
    example: '2025-01-01T17:30:00.000Z',
    description: 'New check-out time (ISO string)',
  })
  @IsOptional()
  @IsDateString()
  check_out_time?: string;

  @ApiPropertyOptional({ enum: ShiftStatus })
  @IsOptional()
  @IsEnum(ShiftStatus)
  status?: ShiftStatus;

  @ApiPropertyOptional({ example: 'Adjusted due to forgot check-in' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'Employee forgot to check-in, HR corrected based on evidence',
  })
  @IsString()
  edit_reason: string;
}


