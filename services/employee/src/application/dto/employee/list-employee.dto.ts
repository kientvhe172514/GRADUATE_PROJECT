import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseEmployeeFilterDto } from './base-employee-filter.dto';

export class ListEmployeeDto extends BaseEmployeeFilterDto {
  @ApiProperty({ required: false, default: 1, minimum: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 10, minimum: 1, maximum: 100, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'], required: false, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED'])
  status?: string;

  @ApiProperty({ required: false, default: 'created_at', type: String })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListEmployeeResponseDto {
  employees: EmployeeSummaryDto[];
  pagination: PaginationDto;
}

export class EmployeeSummaryDto {
  id: number;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  status: string;
  onboarding_status?: string;
  created_at: Date;
  updated_at: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}