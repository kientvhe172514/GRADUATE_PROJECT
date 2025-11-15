import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ListPositionDto {
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

  @ApiProperty({ required: false, type: Number, description: 'Filter by department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id?: number;

  @ApiProperty({ required: false, type: String, description: 'Search in position code or name' })
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

export class ListPositionResponseDto {
  positions: PositionSummaryDto[];
  pagination: PaginationDto;
}

export class PositionSummaryDto {
  id: number;
  position_code: string;
  position_name: string;
  description?: string;
  level: number;
  department_id?: number;
  department_name?: string;
  suggested_role?: string;
  salary_min?: number;
  salary_max?: number;
  currency: string;
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

