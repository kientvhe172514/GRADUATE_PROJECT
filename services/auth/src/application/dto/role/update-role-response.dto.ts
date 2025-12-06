import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  id: number;

  @ApiProperty({ example: 'MANAGER', description: 'Role code' })
  code: string;

  @ApiProperty({ example: 'Senior Manager', description: 'Role name' })
  name: string;

  @ApiProperty({ example: 'Updated description', required: false })
  description?: string;

  @ApiProperty({ example: 3, description: 'Role level' })
  level: number;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: Date;
}
