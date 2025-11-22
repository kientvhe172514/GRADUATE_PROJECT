import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EditLogQueryDto {
  @ApiPropertyOptional({ example: 123 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  employee_id?: number;

  @ApiPropertyOptional({ example: 456 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shift_id?: number;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
