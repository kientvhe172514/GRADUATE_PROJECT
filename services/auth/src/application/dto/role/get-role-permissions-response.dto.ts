import { ApiProperty } from '@nestjs/swagger';

export class RolePermissionDto {
  @ApiProperty({ example: 1, description: 'Permission ID' })
  id: number;

  @ApiProperty({ example: 'role.create', description: 'Permission code' })
  code: string;

  @ApiProperty({ example: 'role', description: 'Permission resource' })
  resource: string;

  @ApiProperty({ example: 'create', description: 'Permission action' })
  action: string;

  @ApiProperty({ example: 'Create new roles', required: false })
  description?: string;

  @ApiProperty({ example: '2024-01-01T08:00:00.000Z', required: false })
  assigned_at?: Date;
}

export class GetRolePermissionsResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  role_id: number;

  @ApiProperty({
    type: [RolePermissionDto],
    description: 'List of permissions',
  })
  permissions: RolePermissionDto[];

  @ApiProperty({ example: 4, description: 'Total number of permissions' })
  total: number;
}
