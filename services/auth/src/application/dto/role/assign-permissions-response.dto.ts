import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  role_id: number;

  @ApiProperty({
    example: [1, 2, 3, 4],
    description: 'Array of assigned permission IDs',
  })
  permission_ids: number[];

  @ApiProperty({
    example: 4,
    description: 'Total number of permissions assigned',
  })
  total_permissions: number;
}
