import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for auth.user-registered event
 */
export class UserRegisteredEventDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'User full name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'Registration timestamp', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

/**
 * DTO for auth.password-changed event
 */
export class PasswordChangedEventDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({ description: 'Event timestamp', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiPropertyOptional({ description: 'IP address where password was changed', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}

/**
 * DTO for auth.password-reset-requested event
 */
export class PasswordResetRequestedEventDto {
  @ApiProperty({ description: 'Account ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  account_id: number;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ description: 'Reset token', example: 'abc123def456' })
  @IsString()
  @IsNotEmpty()
  reset_token: string;

  @ApiProperty({ description: 'Token expiration date', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  expires_at: string;
}

/**
 * DTO for auth.login-success event
 */
export class LoginSuccessEventDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({ description: 'IP address of login', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'Login timestamp', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

/**
 * DTO for auth.suspicious-login event
 */
export class SuspiciousLoginEventDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({ description: 'IP address of suspicious login', example: '192.168.1.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Location of login', example: 'New York, USA' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Event timestamp', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

/**
 * DTO for auth.account-locked event
 */
export class AccountLockedEventDto {
  @ApiProperty({ description: 'User ID', example: 123 })
  @IsNumber()
  @IsNotEmpty()
  @Type(() => Number)
  userId: number;

  @ApiPropertyOptional({ description: 'Reason for account lock', example: 'Multiple failed login attempts' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Event timestamp', example: '2024-01-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  timestamp?: string;
}

