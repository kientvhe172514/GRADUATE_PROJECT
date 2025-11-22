import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBeaconDto {
  @ApiProperty({ example: 'FDA50693-A4E2-4FB1-AFCF-C6EB07647825' })
  @IsString()
  beacon_uuid: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(0)
  @Max(65535)
  beacon_major: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  @Max(65535)
  beacon_minor: number;

  @ApiProperty({ example: 'Main Entrance Beacon' })
  @IsString()
  beacon_name: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  department_id: number;

  @ApiProperty({ example: 'Building A - Floor 1' })
  @IsString()
  location_name: string;

  @ApiPropertyOptional({ example: '1st Floor' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ example: 'Building A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 'A101' })
  @IsOptional()
  @IsString()
  room_number?: string;

  @ApiPropertyOptional({ example: 21.028511 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 105.804817 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  signal_range_meters?: number;

  @ApiPropertyOptional({ example: -70 })
  @IsOptional()
  @IsNumber()
  rssi_threshold?: number;
}

export class UpdateBeaconDto {
  @ApiPropertyOptional({ example: 'Main Entrance Beacon - Updated' })
  @IsOptional()
  @IsString()
  beacon_name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiPropertyOptional({ example: 'Building A - Floor 1' })
  @IsOptional()
  @IsString()
  location_name?: string;

  @ApiPropertyOptional({ example: '1st Floor' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ example: 'Building A' })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({ example: 'A101' })
  @IsOptional()
  @IsString()
  room_number?: string;

  @ApiPropertyOptional({ example: 21.028511 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 105.804817 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  signal_range_meters?: number;

  @ApiPropertyOptional({ example: -70 })
  @IsOptional()
  @IsNumber()
  rssi_threshold?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;
}

export class BeaconQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  department_id?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

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

export class UpdateBeaconHeartbeatDto {
  @ApiPropertyOptional({ example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  battery_level?: number;
}
