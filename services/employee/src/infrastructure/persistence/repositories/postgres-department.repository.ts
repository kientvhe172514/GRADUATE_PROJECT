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

  async findWithPagination(criteria: any): Promise<{ departments: Department[]; total: number }> {
    let whereConditions: string[] = [];
    const whereParams: any[] = [];
    let paramIndex = 1;

    // Filter by status - check for truthy value and non-empty string
    if (criteria.status !== undefined && criteria.status !== null && criteria.status !== '') {
      whereConditions.push(`d.status = $${paramIndex}`);
      whereParams.push(criteria.status);
      paramIndex++;
    }
    
    // Filter by parent_department_id - check for truthy value
    if (criteria.parent_department_id !== undefined && criteria.parent_department_id !== null) {
      whereConditions.push(`d.parent_department_id = $${paramIndex}`);
      whereParams.push(criteria.parent_department_id);
      paramIndex++;
    }

    // Search in department_code or department_name
    if (criteria.search && criteria.search.trim()) {
      const searchTerm = `%${criteria.search.trim()}%`;
      whereConditions.push(`(d.department_code ILIKE $${paramIndex} OR d.department_name ILIKE $${paramIndex + 1})`);
      whereParams.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    // Validate and sanitize sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'department_code', 'department_name', 'status', 'created_at', 'updated_at', 'level', 'parent_department_id'];
    const sortBy = allowedSortFields.includes(criteria.sortBy) ? criteria.sortBy : 'created_at';
    const sortOrder = criteria.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM departments d
      ${whereClause}
    `;
    const countResult = await this.repository.query(countQuery, whereParams);
    const total = parseInt(countResult[0]?.total || '0', 10);

    // Main query with pagination
    const queryParams = [...whereParams];
    const limitParamIndex = paramIndex;
    const offsetParamIndex = paramIndex + 1;
    queryParams.push(criteria.limit || 10, criteria.offset || 0);

    const query = `
      SELECT 
        d.*,
        pd.department_name as parent_department_name
      FROM departments d
      LEFT JOIN departments pd ON pd.id = d.parent_department_id
      ${whereClause}
      ORDER BY d.${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const results = await this.repository.query(query, queryParams);
    const departments = results.map((row: any) => {
      const department = DepartmentMapper.toDomain(row);
      // Add joined field
      (department as any).parent_department_name = row.parent_department_name;
      return department;
    });

    return { departments, total };
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}