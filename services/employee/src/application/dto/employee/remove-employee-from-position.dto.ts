import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveEmployeeFromPositionDto {
  @ApiProperty({ example: 1, required: false, description: 'ID of user performing the removal' })
  @IsOptional()
  removed_by?: number;

  @ApiProperty({ example: 'Position changed', required: false, description: 'Reason for removal' })
  @IsOptional()
  @IsString()
  reason?: string;
}

