import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class TerminateEmployeeDto {
  @ApiProperty({ example: '2024-03-15' })
  @IsDateString()
  @IsNotEmpty()
  termination_date: string;

  @ApiProperty({ example: 'Voluntary resignation' })
  @IsString()
  @IsNotEmpty()
  termination_reason: string;
}