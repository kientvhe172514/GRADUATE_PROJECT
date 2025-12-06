import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '../../domain/entities/device-session.entity';

export class LoginRequestDto {
  @ApiProperty({
    example: 'user@company.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  // Device information (optional for web, required for mobile)
  @ApiPropertyOptional({
    example: 'abc123-device-id',
    description: 'Unique device identifier',
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({
    example: 'Samsung Galaxy S23',
    description: 'Device name',
  })
  @IsOptional()
  @IsString()
  device_name?: string;

  @ApiPropertyOptional({ example: 'Android 14', description: 'Device OS' })
  @IsOptional()
  @IsString()
  device_os?: string;

  @ApiPropertyOptional({ example: 'SM-S911B', description: 'Device model' })
  @IsOptional()
  @IsString()
  device_model?: string;

  @ApiPropertyOptional({
    enum: DevicePlatform,
    example: DevicePlatform.ANDROID,
    description: 'Device platform',
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;

  @ApiPropertyOptional({ example: '1.0.0', description: 'App version' })
  @IsOptional()
  @IsString()
  app_version?: string;

  @ApiPropertyOptional({
    example: { latitude: 10.762622, longitude: 106.660172 },
    description: 'Device location',
  })
  @IsOptional()
  location?: any;

  @ApiPropertyOptional({
    example: 'fcm-token-xyz',
    description: 'FCM token for push notifications',
  })
  @IsOptional()
  @IsString()
  fcm_token?: string;
}
