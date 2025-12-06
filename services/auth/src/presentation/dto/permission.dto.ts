import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'employee.create',
    description: 'Permission code format: resource.action',
  })
  @IsString()
  code: string;

  @ApiProperty({ example: 'employee', description: 'Resource name' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'create', description: 'Action on resource' })
  @IsString()
  action: string;

  @ApiProperty({
    example: 'department',
    required: false,
    description: 'Permission scope',
  })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ example: 'Create new employee records', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: false,
    required: false,
    description: 'System permission cannot be deleted',
  })
  @IsOptional()
  @IsBoolean()
  is_system_permission?: boolean;
}

export class UpdatePermissionDto {
  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'active',
    required: false,
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
