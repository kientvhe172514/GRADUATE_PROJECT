import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountStatusDto {
  @ApiProperty({
    description: 'Account status',
    enum: ['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'],
    example: 'LOCKED',
  })
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'], {
    message: 'Status must be one of: ACTIVE, INACTIVE, LOCKED, SUSPENDED',
  })
  status: string;

  @ApiProperty({
    description: 'Reason for status change',
    required: false,
    example: 'Vi phạm tiêu chuẩn',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAccountStatusResponseDto {
  id: number;
  status: string;
  updated_at: Date;
}
