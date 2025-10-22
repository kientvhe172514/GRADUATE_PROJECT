import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsLatitude, IsLongitude, Min } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'IT-001' })
  @IsString()
  @IsNotEmpty()
  department_code: string;

  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  @IsNotEmpty()
  department_name: string;

  @ApiProperty({ example: 'IT Department handles all technology related matters', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: null, required: false })
  @IsNumber()
  @IsOptional()
  parent_department_id?: number;

  @ApiProperty({ example: null, required: false })
  @IsNumber()
  @IsOptional()
  manager_id?: number;

  @ApiProperty({ example: 'Floor 3, Building A', required: false })
  @IsString()
  @IsOptional()
  office_address?: string;

  @ApiProperty({ example: 10.123456, required: false })
  @IsLatitude()
  @IsOptional()
  office_latitude?: number;

  @ApiProperty({ example: 106.789012, required: false })
  @IsLongitude()
  @IsOptional()
  office_longitude?: number;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  office_radius_meters?: number;
}