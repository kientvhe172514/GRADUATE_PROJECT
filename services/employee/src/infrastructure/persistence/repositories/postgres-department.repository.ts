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
    const updateFields: any = { updated_at: new Date() };

    // Copy defined fields
    if (department.department_code !== undefined) updateFields.department_code = department.department_code;
    if (department.department_name !== undefined) updateFields.department_name = department.department_name;
    if (department.description !== undefined) updateFields.description = department.description;
    if (department.parent_department_id !== undefined) updateFields.parent_department_id = department.parent_department_id;
    if (department.level !== undefined) updateFields.level = department.level;
    if (department.path !== undefined) updateFields.path = department.path;
    if (department.manager_id !== undefined) updateFields.manager_id = department.manager_id;
    if (department.office_address !== undefined) updateFields.office_address = department.office_address;
    if (department.office_latitude !== undefined) updateFields.office_latitude = department.office_latitude;
    if (department.office_longitude !== undefined) updateFields.office_longitude = department.office_longitude;
    if (department.office_radius_meters !== undefined) updateFields.office_radius_meters = department.office_radius_meters;
    if (department.status !== undefined) updateFields.status = department.status;

    // Handle null assignment for nullable fields (when explicitly passed as undefined with 'in' check)
    if ('manager_id' in department && department.manager_id === undefined) {
      updateFields.manager_id = null;
    }
    if ('parent_department_id' in department && department.parent_department_id === undefined) {
      updateFields.parent_department_id = null;
    }

    await this.repository.update(id, updateFields);
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

  async getEmployeeCountByDepartment(departmentId: number): Promise<number> {
    const result = await this.repository.query(
      `SELECT COUNT(*) as total FROM employees WHERE department_id = $1`,
      [departmentId],
    );
    return parseInt(result[0]?.total || '0', 10);
  }

  async getEmployeeCountByStatus(departmentId: number): Promise<{ status: string; count: number }[]> {
    const result = await this.repository.query(
      `SELECT status, COUNT(*) as count 
       FROM employees 
       WHERE department_id = $1 
       GROUP BY status`,
      [departmentId],
    );
    return result.map((row: any) => ({
      status: row.status,
      count: parseInt(row.count, 10),
    }));
  }

  async getEmployeeCountByPosition(departmentId: number): Promise<{ position_id: number; position_name: string; count: number }[]> {
    const result = await this.repository.query(
      `SELECT 
        e.position_id,
        p.position_name,
        COUNT(*) as count
       FROM employees e
       LEFT JOIN positions p ON p.id = e.position_id
       WHERE e.department_id = $1 AND e.position_id IS NOT NULL
       GROUP BY e.position_id, p.position_name
       ORDER BY count DESC`,
      [departmentId],
    );
    return result.map((row: any) => ({
      position_id: row.position_id,
      position_name: row.position_name || 'Unknown',
      count: parseInt(row.count, 10),
    }));
  }

  async getSubDepartmentsCount(departmentId: number): Promise<number> {
    const result = await this.repository.query(
      `SELECT COUNT(*) as total FROM departments WHERE parent_department_id = $1`,
      [departmentId],
    );
    return parseInt(result[0]?.total || '0', 10);
  }

  async findByManagerId(managerId: number): Promise<Department[]> {
    const entities = await this.repository.find({
      where: {
        manager_id: managerId,
        status: 'ACTIVE',
      },
    });
    return entities.map(DepartmentMapper.toDomain);
  }
}