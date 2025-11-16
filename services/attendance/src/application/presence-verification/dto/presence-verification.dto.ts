import { IsNumber, IsNotEmpty, IsOptional, IsString, IsDate, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CapturePresenceVerificationDto {
  @ApiProperty({ example: 123, description: 'Employee ID' })
  @IsNumber()
  @IsNotEmpty()
  employee_id: number;

  @ApiProperty({ example: 456, description: 'Shift ID' })
  @IsNumber()
  @IsNotEmpty()
  shift_id: number;

  @ApiProperty({ example: 1, description: 'Round number (1, 2, 3...)' })
  @IsNumber()
  @Min(1)
  round_number: number;

  @ApiProperty({ example: 21.028511, description: 'Latitude' })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 105.804817, description: 'Longitude' })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ example: 15, description: 'GPS accuracy in meters' })
  @IsOptional()
  @IsNumber()
  location_accuracy?: number;

  @ApiPropertyOptional({ example: 'device-uuid-123', description: 'Device unique identifier' })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({ example: 75, description: 'Battery level percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;

  @ApiProperty({ example: '2024-01-16T10:00:00Z', description: 'Capture timestamp' })
  @Type(() => Date)
  @IsDate()
  captured_at: Date;
}

export class PresenceVerificationResponseDto {
  @ApiProperty()
  verification_round_id: number;

  @ApiProperty()
  is_valid: boolean;

  @ApiProperty()
  distance_from_office_meters: number;

  @ApiProperty()
  validation_status: string;

  @ApiProperty()
  validation_reason?: string;

  @ApiProperty()
  rounds_completed: number;

  @ApiProperty()
  rounds_required: number;

  @ApiProperty()
  next_verification_at?: Date;

  static fromDomain(
    round: any,
    shift: any,
  ): PresenceVerificationResponseDto {
    const dto = new PresenceVerificationResponseDto();
    dto.verification_round_id = round.id;
    dto.is_valid = round.is_valid;
    dto.distance_from_office_meters = round.distance_from_office_meters || 0;
    dto.validation_status = round.validation_status;
    dto.validation_reason = round.validation_reason;
    dto.rounds_completed = shift.presence_verification_rounds_completed || 0;
    dto.rounds_required = shift.presence_verification_rounds_required || 3;
    return dto;
  }
}

export class VerificationScheduleDto {
  @ApiProperty()
  has_active_shift: boolean;

  @ApiProperty()
  shift_id?: number;

  @ApiProperty()
  shift_date?: string;

  @ApiProperty()
  check_in_time?: string;

  @ApiProperty()
  current_round: number;

  @ApiProperty()
  total_rounds: number;

  @ApiProperty()
  next_verification_at?: Date;

  @ApiProperty({ type: [Object] })
  schedule: any[];
}

export class VerificationRoundInfoDto {
  @ApiProperty()
  round: number;

  @ApiProperty()
  scheduled_time: string;

  @ApiProperty()
  status: 'COMPLETED' | 'PENDING' | 'MISSED';

  @ApiProperty()
  captured_at?: Date;

  @ApiProperty()
  is_valid?: boolean;

  @ApiProperty()
  is_due?: boolean;
}
