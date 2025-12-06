import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({
    example: 'face-recognition-service',
    description: 'Service name using this API key',
  })
  @IsString()
  service_name: string;

  @ApiProperty({
    example: 'API key for face recognition service',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: ['192.168.1.100', '10.0.0.5'],
    required: false,
    description: 'Whitelist IPs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_ips?: string[];

  @ApiProperty({
    example: 1000,
    required: false,
    description: 'Max requests per hour',
  })
  @IsOptional()
  @IsNumber()
  rate_limit_per_hour?: number;

  @ApiProperty({
    example: ['face.recognize', 'face.register'],
    description: 'Array of permission codes',
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    example: { department_ids: [1, 2], location_ids: [5] },
    required: false,
    description: 'Scope constraints object',
  })
  @IsOptional()
  @IsObject()
  scope_constraints?: Record<string, any>;

  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    required: false,
    description: 'Expiration date (ISO)',
  })
  @IsOptional()
  @IsString()
  expires_at?: string;
}

export class UpdateApiKeyDto {
  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: ['192.168.1.200'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_ips?: string[];

  @ApiProperty({ example: 2000, required: false })
  @IsOptional()
  @IsNumber()
  rate_limit_per_hour?: number;

  @ApiProperty({ example: ['face.recognize'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiProperty({ example: { department_ids: [3] }, required: false })
  @IsOptional()
  @IsObject()
  scope_constraints?: Record<string, any>;

  @ApiProperty({
    example: 'active',
    required: false,
    enum: ['active', 'inactive', 'revoked'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: '2026-01-31T23:59:59Z', required: false })
  @IsOptional()
  @IsString()
  expires_at?: string;
}
