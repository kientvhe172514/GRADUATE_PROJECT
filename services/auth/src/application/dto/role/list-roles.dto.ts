import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRolesDto {
  @ApiProperty({ 
    enum: ['active', 'inactive'], 
    required: false, 
    description: 'Filter by status' 
  })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;

  @ApiProperty({ 
    example: 1, 
    required: false, 
    default: 1,
    description: 'Page number',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ 
    example: 20, 
    required: false, 
    default: 20,
    description: 'Items per page',
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

