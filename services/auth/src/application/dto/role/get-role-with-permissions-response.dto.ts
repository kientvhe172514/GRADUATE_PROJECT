import { ApiProperty } from '@nestjs/swagger';
import { GetRoleResponseDto } from './get-role-response.dto';

export class PermissionDto {
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
}

export class GetRoleWithPermissionsResponseDto extends GetRoleResponseDto {
  @ApiProperty({ type: [PermissionDto], description: 'List of permissions assigned to role' })
  permissions: PermissionDto[];
}

