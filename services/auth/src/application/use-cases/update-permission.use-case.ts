import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../tokens';
import { PermissionRepositoryPort } from '../ports/permission.repository.port';

export interface UpdatePermissionCommand {
  id: number;
  description?: string;
  status?: string;
  updated_by: string;
}

@Injectable()
export class UpdatePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(command: UpdatePermissionCommand) {
    // Check if permission exists
    const existing = await this.permissionRepository.findById(command.id);
    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    // Business rule: cannot update system permissions
    if (existing.is_system_permission) {
      throw new ForbiddenException('Cannot update system permission');
    }

    // Business rule: only allow update description and status (not code, resource, action)
    const updateData: any = {
      updated_by: command.updated_by,
    };

    if (command.description !== undefined) {
      updateData.description = command.description;
    }

    if (command.status !== undefined) {
      // Validate status enum
      if (!['active', 'inactive'].includes(command.status)) {
        throw new Error('Invalid status. Must be "active" or "inactive"');
      }
      updateData.status = command.status;
    }

    return await this.permissionRepository.update(command.id, updateData);
  }
}
