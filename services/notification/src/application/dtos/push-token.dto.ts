import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Platform } from '../../domain/entities/push-token.entity';

export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Unique device identifier (UUID or device-specific ID)',
    example: 'iphone_xyz_12345',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'FCM (Firebase Cloud Messaging) token for push notifications',
    example: 'fcm_abc123xyz...',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Device platform type',
    enum: Platform,
    example: Platform.IOS,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;

  @ApiProperty({
    description: 'Device session ID from Auth Service (optional - used for internal sync)',
    example: 123,
    required: false,
  })
  @IsOptional()
  deviceSessionId?: number;

  // ❌ REMOVED: employeeId - Extracted from JWT token
}

export class UnregisterPushTokenDto {
  @ApiProperty({
    description: 'Device ID to unregister (optional if token is provided)',
    example: 'iphone_xyz_12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    description: 'FCM token to unregister (optional if deviceId is provided)',
    example: 'fcm_abc123xyz...',
    required: false,
  })
  @IsOptional()
  @IsString()
  token?: string;

  // ℹ️ At least one of deviceId or token must be provided
}
