import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PERMISSION_REPOSITORY } from '../tokens';
import { PermissionRepositoryPort } from '../ports/permission.repository.port';

export interface DeletePermissionCommand {
  id: number;
}

@Injectable()
export class DeletePermissionUseCase {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async execute(command: DeletePermissionCommand): Promise<void> {
    // Check if permission exists
    const existing = await this.permissionRepository.findById(command.id);
    if (!existing) {
      throw new NotFoundException('Permission not found');
    }

    // Business rule: cannot delete system permissions
    if (existing.is_system_permission) {
      throw new ForbiddenException('Cannot delete system permission');
    }

    // Delete permission (cascade will remove from role_permissions and account_permissions)
    await this.permissionRepository.delete(command.id);
  }
}
