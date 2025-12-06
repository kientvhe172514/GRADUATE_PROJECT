import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  id: number;

  @ApiProperty({ example: 'MANAGER', description: 'Role code' })
  code: string;

  @ApiProperty({ example: 'Manager', description: 'Role name' })
  name: string;

  @ApiProperty({ example: 'Department manager role', required: false })
  description?: string;

  @ApiProperty({ example: 2, description: 'Role level' })
  level: number;

  @ApiProperty({ example: false, description: 'System role flag' })
  is_system_role: boolean;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive'] })
  status: string;

  @ApiProperty({ example: '2024-01-01T08:00:00.000Z' })
  created_at: Date;
}
