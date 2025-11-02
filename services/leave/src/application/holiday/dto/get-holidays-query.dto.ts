import { IsOptional, IsInt, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for Get Holidays query parameters
 */
export class GetHolidaysQueryDto {
  @ApiPropertyOptional({
    description: 'Năm của holidays',
    example: 2024,
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Loại holiday (NATIONAL, RELIGIOUS, COMPANY, etc.)',
    example: 'NATIONAL',
    type: String,
  })
  @IsOptional()
  @IsString()
  holiday_type?: string;
}

