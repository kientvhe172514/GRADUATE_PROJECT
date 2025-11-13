import { IsEmail, IsNumber, IsString, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  employee_id?: number;

  @ApiProperty({ example: 'EMP001', required: false })
  @IsString()
  @IsOptional()
  employee_code?: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  department_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  department_name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  position_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  position_name?: string;

  @ApiProperty({ 
    required: false, 
    example: 'EMPLOYEE',
    description: 'Role to assign (ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE). Defaults to EMPLOYEE if not provided or invalid.' 
  })
  @IsString()
  @IsOptional()
  suggested_role?: string; // Role suggested from position (e.g., "DEPARTMENT_MANAGER", "EMPLOYEE", "HR_MANAGER")

  @ApiProperty({ 
    required: false, 
    example: 'SecurePassword123!',
    description: 'Custom password. If not provided, temporary password "1" will be used.',
    minLength: 6
  })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string; // Optional custom password for manual account creation
}