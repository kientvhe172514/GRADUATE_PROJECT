import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListAccountsRequestDto {
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

  @ApiProperty({ required: false, type: String })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, type: String, description: 'Filter by status (e.g., ACTIVE, INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, type: String, description: 'Filter by role (e.g., ADMIN, EMPLOYEE)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, type: Number, description: 'Filter by department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  department_id?: number;

  @ApiProperty({ required: false, default: 'created_at', type: String })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListAccountsResponseDto {
  accounts: AccountSummaryDto[];
  pagination: PaginationDto;
}

export class AccountSummaryDto {
  id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  department_id: number;
  department_name: string;
  position_id: number;
  position_name: string;
  employee_id: number;
  employee_code: string;
  last_login_at: Date | null;
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
