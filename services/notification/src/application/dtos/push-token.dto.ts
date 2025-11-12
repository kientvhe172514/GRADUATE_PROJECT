import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { Platform } from '../../domain/entities/push-token.entity';

export class RegisterPushTokenDto {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsNumber()
  deviceSessionId?: number;

  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsEnum(Platform)
  platform: Platform;
}

export class UnregisterPushTokenDto {
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  token?: string;
}
