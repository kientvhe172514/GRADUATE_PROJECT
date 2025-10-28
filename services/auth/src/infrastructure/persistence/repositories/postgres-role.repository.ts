import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleSchema } from '../typeorm/role.schema';
import { RoleRepositoryPort } from '../../../application/ports/role.repository.port';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class PostgresRoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectRepository(RoleSchema)
    private repository: Repository<RoleEntity>,
  ) {}

  async getPermissionsByRoleCode(roleCode: string): Promise<string[]> {
    const result: { code: string }[] = await this.repository.query(
      `
      SELECT p.code
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN roles r ON r.id = rp.role_id
      WHERE r.code = $1 AND p.status = 'active' AND r.status = 'active'
    `,
      [roleCode],
    );

    return result.map((row) => row.code);
  }

  async findAll(filters?: { status?: string; page?: number; limit?: number }): Promise<{ roles: any[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('role');

    if (filters?.status) {
      queryBuilder.where('role.status = :status', { status: filters.status });
    }

    const [roles, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('role.level', 'ASC')
      .getManyAndCount();

    return { roles, total };
  }

  async findById(id: number): Promise<any | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByIdWithPermissions(id: number): Promise<any | null> {
    const result = await this.repository.query(
      `
      SELECT 
        r.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'code', p.code,
              'resource', p.resource,
              'action', p.action,
              'description', p.description
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'
        ) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON p.id = rp.permission_id AND p.status = 'active'
      WHERE r.id = $1
      GROUP BY r.id
    `,
      [id],
    );

    return result[0] || null;
  }

  async create(roleData: any): Promise<any> {
    const role = this.repository.create(roleData);
    return await this.repository.save(role);
  }

  async update(id: number, roleData: any): Promise<any> {
    await this.repository.update(id, roleData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Remove existing permissions
    await this.repository.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

    // Insert new permissions
    if (permissionIds.length > 0) {
      const values = permissionIds.map((permId) => `(${roleId}, ${permId})`).join(',');
      await this.repository.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`);
    }
  }

  async removePermission(roleId: number, permissionId: number): Promise<void> {
    await this.repository.query('DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2', [
      roleId,
      permissionId,
    ]);
  }

  async getRolePermissions(roleId: number): Promise<any[]> {
    const result = await this.repository.query(
      `
      SELECT p.*
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = $1 AND p.status = 'active'
      ORDER BY p.resource, p.action
    `,
      [roleId],
    );

    return result;
  }
}