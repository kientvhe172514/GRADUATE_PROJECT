import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  id: number;

  @ApiProperty({ example: 'HR_MANAGER', description: 'Role code (uppercase)' })
  code: string;

  @ApiProperty({ example: 'HR Manager', description: 'Role display name' })
  name: string;

  @ApiProperty({ 
    example: 'HR department manager with full employee management permissions', 
    description: 'Role description',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    example: 2, 
    description: 'Role hierarchy level (1=highest, 4=lowest)' 
  })
  level: number;

  @ApiProperty({ 
    example: true, 
    description: 'System role cannot be deleted' 
  })
  is_system_role: boolean;

  @ApiProperty({ 
    example: 'active', 
    description: 'Role status',
    enum: ['active', 'inactive']
  })
  status: string;

  @ApiProperty({ 
    example: '2025-01-01T00:00:00.000Z', 
    description: 'Creation timestamp' 
  })
  created_at: Date;

  @ApiProperty({ 
    example: '2025-01-01T00:00:00.000Z', 
    description: 'Last update timestamp' 
  })
  updated_at: Date;

  @ApiProperty({ 
    example: 1, 
    description: 'Creator account ID',
    required: false 
  })
  created_by?: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Last updater account ID',
    required: false 
  })
  updated_by?: number;
}

export class PermissionResponseDto {
  @ApiProperty({ example: 1, description: 'Permission ID' })
  id: number;

  @ApiProperty({ 
    example: 'employee.create', 
    description: 'Permission code (format: resource.action or resource.action.scope)' 
  })
  code: string;

  @ApiProperty({ example: 'employee', description: 'Resource name' })
  resource: string;

  @ApiProperty({ example: 'create', description: 'Action on resource' })
  action: string;

  @ApiProperty({ 
    example: 'department', 
    description: 'Permission scope (own, department, all)',
    required: false 
  })
  scope?: string;

  @ApiProperty({ 
    example: 'Create new employee records', 
    description: 'Permission description',
    required: false 
  })
  description?: string;

  @ApiProperty({ 
    example: true, 
    description: 'System permission cannot be deleted' 
  })
  is_system_permission: boolean;

  @ApiProperty({ 
    example: 'active', 
    description: 'Permission status',
    enum: ['active', 'inactive']
  })
  status: string;

  @ApiProperty({ 
    example: '2025-01-01T00:00:00.000Z', 
    description: 'Creation timestamp' 
  })
  created_at: Date;

  @ApiProperty({ 
    example: '2025-01-01T00:00:00.000Z', 
    description: 'Last update timestamp' 
  })
  updated_at: Date;
}

export class RoleWithPermissionsDto extends RoleResponseDto {
  @ApiProperty({ 
    type: [PermissionResponseDto], 
    description: 'List of permissions assigned to this role' 
  })
  permissions: PermissionResponseDto[];
}

export class RoleListResponseDto {
  @ApiProperty({ type: [RoleResponseDto], description: 'List of roles' })
  roles: RoleResponseDto[];

  @ApiProperty({ example: 10, description: 'Total number of roles' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 20, description: 'Items per page' })
  limit: number;
}

export class PermissionListResponseDto {
  @ApiProperty({ type: [PermissionResponseDto], description: 'List of permissions' })
  permissions: PermissionResponseDto[];

  @ApiProperty({ example: 50, description: 'Total number of permissions' })
  total: number;

  @ApiProperty({ example: 1, description: 'Current page' })
  page: number;

  @ApiProperty({ example: 50, description: 'Items per page' })
  limit: number;
}
