import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListEmployeeDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  department_id?: number;

  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'TERMINATED'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'TERMINATED'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}