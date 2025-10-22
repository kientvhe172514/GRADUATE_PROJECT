import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DepartmentSchema } from '../typeorm/department.schema';
import { DepartmentRepositoryPort } from '../../../application/ports/department.repository.port';
import { Department } from '../../../domain/entities/department.entity';
import { DepartmentMapper } from '../mappers/department.mapper';

@Injectable()
export class PostgresDepartmentRepository implements DepartmentRepositoryPort {
  constructor(
    @InjectRepository(DepartmentSchema)
    private repository: Repository<Department>,
  ) {}

  async create(department: Department): Promise<Department> {
    const entity = DepartmentMapper.toPersistence(department);
    const savedEntity = await this.repository.save(entity);
    return DepartmentMapper.toDomain(savedEntity);
  }

  async findByCode(code: string): Promise<Department | null> {
    const entity = await this.repository.findOne({ where: { department_code: code } });
    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<Department | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? DepartmentMapper.toDomain(entity) : null;
  }

  async update(id: number, department: Partial<Department>): Promise<Department> {
    await this.repository.update(id, { ...department, updated_at: new Date() });
    const updated = await this.repository.findOne({ where: { id } });
    return DepartmentMapper.toDomain(updated!);
  }

  async findAll(): Promise<Department[]> {
    const entities = await this.repository.find();
    return entities.map(DepartmentMapper.toDomain);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}