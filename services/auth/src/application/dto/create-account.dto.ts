import { IsEmail, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNumber()
  employee_id: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  employee_code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ required: false })
  @IsNumber()
  department_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  department_name?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  position_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  position_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  suggested_role?: string; // Role suggested from position (e.g., "MANAGER", "EMPLOYEE", "HR")
}