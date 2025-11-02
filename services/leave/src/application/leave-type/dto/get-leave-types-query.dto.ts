import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for Get Leave Types query parameters
 */
export class GetLeaveTypesQueryDto {
  @ApiPropertyOptional({
    description: 'Chỉ lấy leave types đang active',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  active?: boolean;
}

