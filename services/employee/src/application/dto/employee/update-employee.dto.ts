import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmployeeDto {
  @ApiProperty({ example: 'Nguyễn', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @ApiProperty({ example: 'Văn A', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  last_name?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsOptional()
  @IsDateString()
  date_of_birth?: string;

  @ApiProperty({ enum: ['MALE', 'FEMALE', 'OTHER'], required: false })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: string;

  @ApiProperty({ example: '123456789', required: false })
  @IsOptional()
  @IsString()
  national_id?: string;

  @ApiProperty({ example: 'employee@company.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 'personal@email.com', required: false })
  @IsOptional()
  @IsEmail()
  personal_email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  address?: object;

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

  @ApiProperty({ example: '2025-10-07', required: false })
  @IsOptional()
  @IsDateString()
  hire_date?: string;

  @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'], required: false })
  @IsOptional()
  @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT'])
  employment_type?: string;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED'])
  status?: string;

  @ApiProperty({ example: '2025-12-31', required: false })
  @IsOptional()
  @IsDateString()
  termination_date?: string;

  @ApiProperty({ example: 'Voluntary resignation', required: false })
  @IsOptional()
  @IsString()
  termination_reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  emergency_contact?: object;

  @ApiProperty({ enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
  onboarding_status?: string;

  @ApiProperty({ example: 85, required: false })
  @IsOptional()
  @IsNumber()
  profile_completion_percentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  external_refs?: object;
}