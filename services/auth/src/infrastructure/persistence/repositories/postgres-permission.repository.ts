import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PermissionSchema } from '../typeorm/permission.schema';
import { PermissionRepositoryPort } from '../../../application/ports/permission.repository.port';
import { PermissionEntity } from '../entities/permission.entity';

@Injectable()
export class PostgresPermissionRepository implements PermissionRepositoryPort {
  constructor(
    @InjectRepository(PermissionSchema)
    private repository: Repository<PermissionEntity>,
  ) {}

  async findAll(filters?: {
    resource?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ permissions: any[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('permission');

    if (filters?.resource) {
      queryBuilder.where('permission.resource = :resource', { resource: filters.resource });
    }

    if (filters?.status) {
      queryBuilder.andWhere('permission.status = :status', { status: filters.status });
    }

    const [permissions, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('permission.resource', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getManyAndCount();

    return { permissions, total };
  }

  async findById(id: number): Promise<any | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByCode(code: string): Promise<any | null> {
    return await this.repository.findOne({ where: { code } });
  }

  async findByResource(resource: string): Promise<any[]> {
    return await this.repository.find({
      where: { resource, status: 'active' },
      order: { action: 'ASC' },
    });
  }

  async create(permissionData: any): Promise<any> {
    const permission = this.repository.create(permissionData);
    return await this.repository.save(permission);
  }

  async update(id: number, permissionData: any): Promise<any> {
    await this.repository.update(id, permissionData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
