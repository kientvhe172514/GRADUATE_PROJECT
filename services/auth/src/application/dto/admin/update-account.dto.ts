import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsIn,
  IsObject,
} from 'class-validator';

/**
 * DTO for Admin to update account information including role assignment
 * This is different from UpdateAccountStatusDto which only updates status
 */
export class AdminUpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Email address',
    example: 'user@zentry.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Role code to assign',
    enum: [
      'SUPER_ADMIN',
      'ADMIN',
      'HR_MANAGER',
      'DEPARTMENT_MANAGER',
      'EMPLOYEE',
    ],
    example: 'HR_MANAGER',
  })
  @IsOptional()
  @IsString()
  @IsIn(
    ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'],
    {
      message:
        'Role must be one of: SUPER_ADMIN, ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE',
    },
  )
  role?: string;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: ['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'],
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'], {
    message: 'Status must be one of: ACTIVE, INACTIVE, LOCKED, SUSPENDED',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Employee ID (link to employee service)',
    example: 123,
  })
  @IsOptional()
  @IsNumber()
  employee_id?: number;

  @ApiPropertyOptional({
    description: 'Employee code (auto-generated format: EMP+YYYYMMDD+XXX)',
    example: 'EMP20251129001',
  })
  @IsOptional()
  @IsString()
  employee_code?: string;

  @ApiPropertyOptional({
    description: 'Department ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiPropertyOptional({
    description: 'Department name',
    example: 'Human Resources',
  })
  @IsOptional()
  @IsString()
  department_name?: string;

  @ApiPropertyOptional({
    description: 'Position ID',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  position_id?: number;

  @ApiPropertyOptional({
    description: 'Position name',
    example: 'HR Manager',
  })
  @IsOptional()
  @IsString()
  position_name?: string;

  @ApiPropertyOptional({
    description: 'External IDs mapping',
    example: { ldap_id: '12345', sso_id: 'abc123' },
  })
  @IsOptional()
  @IsObject()
  external_ids?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { notes: 'Migrated from old system' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Response DTO for admin update account
 */
export class AdminUpdateAccountResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@zentry.com' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  full_name?: string;

  @ApiProperty({ example: 'HR_MANAGER' })
  role: string;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;

  @ApiProperty({ example: 123, required: false })
  employee_id?: number;

  @ApiProperty({ example: 'EMP001', required: false })
  employee_code?: string;

  @ApiProperty({ example: 1, required: false })
  department_id?: number;

  @ApiProperty({ example: 'Human Resources', required: false })
  department_name?: string;

  @ApiProperty({ example: 5, required: false })
  position_id?: number;

  @ApiProperty({ example: 'HR Manager', required: false })
  position_name?: string;

  @ApiProperty({ example: 2 })
  sync_version: number;

  @ApiProperty({ example: '2025-11-17T10:30:00.000Z' })
  updated_at: Date;
}
