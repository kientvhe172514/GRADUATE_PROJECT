import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListAuditLogsRequestDto {
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

  @ApiProperty({ required: false, type: Number, description: 'Filter by account ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  account_id?: number;

  @ApiProperty({ required: false, type: String, description: 'Filter by action' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiProperty({ required: false, type: Boolean, description: 'Filter by success status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  success?: boolean;

  @ApiProperty({ required: false, type: String, description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty({ required: false, type: String, description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  end_date?: string;

  @ApiProperty({ required: false, default: 'created_at', type: String })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class ListAuditLogsResponseDto {
  logs: AuditLogSummaryDto[];
  pagination: PaginationDto;
}

export class AuditLogSummaryDto {
  id: number;
  account_id: number | null;
  email: string | null;
  action: string;
  success: boolean;
  ip_address: string | null;
  user_agent: string | null;
  error_message: string | null;
  metadata: any;
  created_at: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
