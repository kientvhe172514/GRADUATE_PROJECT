import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListDepartmentDto {
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

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE'], required: false, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiProperty({ required: false, type: Number, description: 'Filter by parent department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parent_department_id?: number;

  @ApiProperty({ required: false, type: String, description: 'Search in department code or name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, default: 'created_at', type: String })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListDepartmentResponseDto {
  departments: DepartmentSummaryDto[];
  pagination: PaginationDto;
}

export class DepartmentSummaryDto {
  id: number;
  department_code: string;
  department_name: string;
  description?: string;
  parent_department_id?: number;
  parent_department_name?: string;
  level: number;
  manager_id?: number;
  status: string;
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

