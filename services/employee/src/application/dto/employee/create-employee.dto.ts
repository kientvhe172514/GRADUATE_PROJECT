import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({
    example: null,
    description: '🔄 Auto-generated if not provided. Format: EMP + YYYYMMDD + XXX (e.g., EMP20251129001). Only provide if you want to use a custom code.',
    required: false,
  })
  @IsString()
  @IsOptional()
  employee_code?: string;

  @ApiProperty({ example: 'Nguyễn' })
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @ApiProperty({ example: 'Văn A' })
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  date_of_birth: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 'a@company.com', description: 'Company email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'nguyenvana.personal@gmail.com',
    description: 'Personal email for receiving account credentials',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  position_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  manager_id?: number;

  @ApiProperty({ example: '2025-10-07' })
  @IsDateString()
  @IsNotEmpty()
  hire_date: string;

  @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'] })
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
  @IsNotEmpty()
  employment_type: string;
}
