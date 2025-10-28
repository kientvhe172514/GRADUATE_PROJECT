import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER', description: 'Unique role code (uppercase)' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Manager', description: 'Role display name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Department manager role', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2, description: 'Role level (higher = more privileges)' })
  @IsNumber()
  level: number;

  @ApiProperty({ example: false, required: false, description: 'System role cannot be deleted' })
  @IsOptional()
  @IsBoolean()
  is_system_role?: boolean;
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Senior Manager', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 3, required: false })
  @IsOptional()
  @IsNumber()
  level?: number;

  @ApiProperty({ example: 'active', required: false, enum: ['active', 'inactive'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AssignPermissionsToRoleDto {
  @ApiProperty({ example: [1, 2, 3, 4], description: 'Array of permission IDs' })
  @IsNumber({}, { each: true })
  permission_ids: number[];
}
