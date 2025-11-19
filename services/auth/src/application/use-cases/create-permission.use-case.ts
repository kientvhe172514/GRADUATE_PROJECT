import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../tokens';
import { PermissionRepositoryPort } from '../ports/permission.repository.port';

export interface CreatePermissionCommand {
  code: string;
  resource: string;
  action: string;
  scope?: string;
  description?: string;
  is_system_permission?: boolean;
  created_by: string;
}

@Injectable()
export class CreatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(command: CreatePermissionCommand) {
    // Validate code format: resource.action or resource.action.scope
    const codePattern = /^[a-z_]+\.[a-z_]+(\.[a-z_]+)?$/;
    if (!codePattern.test(command.code)) {
      throw new Error(
        'Invalid permission code format. Must be "resource.action" or "resource.action.scope"',
      );
    }

    // Check if code already exists (business rule: unique permission code)
    const existing = await this.permissionRepository.findByCode?.(command.code);
    if (existing) {
      throw new ConflictException(`Permission with code "${command.code}" already exists`);
    }

    // Create permission
    return await this.permissionRepository.create({
      ...command,
      status: 'active',
      is_system_permission: command.is_system_permission || false,
      updated_by: command.created_by,
    });
  }
}
