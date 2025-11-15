import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeSchema } from '../typeorm/employee.schema';
import { EmployeeRepositoryPort } from '../../../application/ports/employee.repository.port';
import { Employee } from '../../../domain/entities/employee.entity';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeMapper } from '../mappers/employee.mapper';
import { ListEmployeeDto } from '../../../application/dto/employee/list-employee.dto';

@Injectable()
export class PostgresEmployeeRepository implements EmployeeRepositoryPort {
  constructor(
    @InjectRepository(EmployeeSchema)
    private repository: Repository<EmployeeEntity>,
  ) {}

  async create(employee: Employee): Promise<Employee> {  
    const entity = EmployeeMapper.toPersistence(employee);
    const savedEntity = await this.repository.save(entity);
    return EmployeeMapper.toDomain(savedEntity);
  }

  async findByCode(code: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { employee_code: code } });
    return entity ? EmployeeMapper.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? EmployeeMapper.toDomain(entity) : null;
  }

  async findById(id: number): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? EmployeeMapper.toDomain(entity) : null;
  }

  async update(id: number, employee: Partial<Employee>): Promise<Employee> {
    const existingEntity = await this.repository.findOne({ where: { id } });
    if (!existingEntity) {
      throw new Error('Employee not found');
    }

    const updateEntity = EmployeeMapper.toPersistence(employee as Employee);
    await this.repository.update(id, { ...updateEntity, updated_at: new Date() });
    
    const updatedEntity = await this.repository.findOne({ where: { id } });
    return EmployeeMapper.toDomain(updatedEntity!);
  }

  async updateAccountId(id: number, accountId: number): Promise<void> {
    await this.repository.update(id, { account_id: accountId });
  }

  async updateOnboardingStatus(id: number, status: string): Promise<void> {
    await this.repository.update(id, { onboarding_status: status });
  }

  async findAll(filters?: ListEmployeeDto): Promise<Employee[]> {
    const queryBuilder = this.repository.createQueryBuilder('employee');
    
    // Filter by department_id - explicitly check for values
    if (filters?.department_id !== undefined && filters?.department_id !== null) {
      queryBuilder.andWhere('employee.department_id = :department_id', { department_id: filters.department_id });
    }
    
    // Filter by status - explicitly check for values
    if (filters?.status !== undefined && filters?.status !== null && filters?.status !== '') {
      queryBuilder.andWhere('employee.status = :status', { status: filters.status });
    }
    
    // Search filter - search in employee_code, email, or full_name
    if (filters?.search !== undefined && filters?.search !== null && filters?.search !== '') {
      queryBuilder.andWhere(
        '(employee.employee_code ILIKE :search OR employee.email ILIKE :search OR employee.full_name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    queryBuilder.orderBy('employee.created_at', 'DESC');

    const employees = await queryBuilder.getMany();

    return employees.map(employee => EmployeeMapper.toDomain(employee));
  }

  async findWithPagination(criteria: any): Promise<{ employees: Employee[]; total: number }> {
    // Use raw query to join with departments and positions tables
    let whereConditions: string[] = [];
    const whereParams: any[] = [];
    let paramIndex = 1;

    // Filter by status - check for truthy value and non-empty string
    if (criteria.status !== undefined && criteria.status !== null && criteria.status !== '') {
      whereConditions.push(`e.status = $${paramIndex}`);
      whereParams.push(criteria.status);
      paramIndex++;
    }
    
    // Filter by department_id - check for truthy value
    if (criteria.department_id !== undefined && criteria.department_id !== null) {
      whereConditions.push(`e.department_id = $${paramIndex}`);
      whereParams.push(criteria.department_id);
      paramIndex++;
    }

    // Search in employee_code, email, or full_name
    if (criteria.search && criteria.search.trim()) {
      const searchTerm = `%${criteria.search.trim()}%`;
      whereConditions.push(`(e.employee_code ILIKE $${paramIndex} OR e.email ILIKE $${paramIndex + 1} OR e.full_name ILIKE $${paramIndex + 2})`);
      whereParams.push(searchTerm, searchTerm, searchTerm);
      paramIndex += 3;
    }

    // Validate and sanitize sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'employee_code', 'full_name', 'email', 'status', 'created_at', 'updated_at', 'department_id', 'position_id'];
    const sortBy = allowedSortFields.includes(criteria.sortBy) ? criteria.sortBy : 'created_at';
    const sortOrder = criteria.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employees e
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
        e.*,
        d.department_name,
        p.position_name
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN positions p ON p.id = e.position_id
      ${whereClause}
      ORDER BY e.${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const results = await this.repository.query(query, queryParams);
    const employees = results.map((row: any) => {
      const employee = EmployeeMapper.toDomain(row);
      // Add joined fields
      (employee as any).department_name = row.department_name;
      (employee as any).position_name = row.position_name;
      return employee;
    });

    return { employees, total };
  }
}