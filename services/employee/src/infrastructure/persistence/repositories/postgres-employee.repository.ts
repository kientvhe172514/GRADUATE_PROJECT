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
    // Manual left join with department to avoid foreign key constraint issues
    const result = await this.repository.query(`
      SELECT 
        e.*,
        d.id as department_id_rel,
        d.department_code,
        d.department_name,
        d.office_address,
        d.office_latitude,
        d.office_longitude,
        d.office_radius_meters
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE e.id = $1
    `, [id]);
    
    if (!result || result.length === 0) return null;
    
    const row = result[0];
    const employeeEntity = new EmployeeEntity();
    Object.assign(employeeEntity, row);
    
    // Map department relation if exists
    if (row.department_id) {
      employeeEntity.department = {
        id: row.department_id_rel,
        department_code: row.department_code,
        department_name: row.department_name,
        office_address: row.office_address,
        office_latitude: row.office_latitude,
        office_longitude: row.office_longitude,
        office_radius_meters: row.office_radius_meters,
      };
    }
    
    return EmployeeMapper.toDomain(employeeEntity);
  }

  async update(id: number, employee: Partial<Employee>): Promise<Employee> {
    const existingEntity = await this.repository.findOne({ where: { id } });
    if (!existingEntity) {
      throw new Error('Employee not found');
    }

    // Build update object with only fields that are explicitly provided (not undefined)
    const updateFields: any = {
      updated_at: new Date(),
    };

    // Only include fields that are explicitly set (not undefined)
    if (employee.first_name !== undefined) updateFields.first_name = employee.first_name;
    if (employee.last_name !== undefined) updateFields.last_name = employee.last_name;
    if (employee.full_name !== undefined) updateFields.full_name = employee.full_name;
    if (employee.date_of_birth !== undefined) updateFields.date_of_birth = employee.date_of_birth;
    if (employee.gender !== undefined) updateFields.gender = employee.gender;
    if (employee.national_id !== undefined) updateFields.national_id = employee.national_id;
    if (employee.email !== undefined) updateFields.email = employee.email;
    if (employee.phone_number !== undefined) updateFields.phone_number = employee.phone_number;
    if (employee.personal_email !== undefined) updateFields.personal_email = employee.personal_email;
    if (employee.address !== undefined) updateFields.address = employee.address;
    if (employee.department_id !== undefined) updateFields.department_id = employee.department_id;
    if (employee.position_id !== undefined) updateFields.position_id = employee.position_id;
    if (employee.manager_id !== undefined) updateFields.manager_id = employee.manager_id;
    if (employee.hire_date !== undefined) updateFields.hire_date = employee.hire_date;
    if (employee.employment_type !== undefined) updateFields.employment_type = employee.employment_type;
    if (employee.status !== undefined) updateFields.status = employee.status;
    if (employee.termination_date !== undefined) updateFields.termination_date = employee.termination_date;
    if (employee.termination_reason !== undefined) updateFields.termination_reason = employee.termination_reason;
    if (employee.emergency_contact !== undefined) updateFields.emergency_contact = employee.emergency_contact;
    if (employee.onboarding_status !== undefined) updateFields.onboarding_status = employee.onboarding_status;
    if (employee.onboarding_completed_at !== undefined) updateFields.onboarding_completed_at = employee.onboarding_completed_at;
    if (employee.profile_completion_percentage !== undefined) updateFields.profile_completion_percentage = employee.profile_completion_percentage;
    if (employee.external_refs !== undefined) updateFields.external_refs = employee.external_refs;
    if (employee.updated_by !== undefined) updateFields.updated_by = employee.updated_by;

    // Handle null assignment for nullable fields
    if ('department_id' in employee && employee.department_id === undefined) {
      updateFields.department_id = null;
    }
    if ('position_id' in employee && employee.position_id === undefined) {
      updateFields.position_id = null;
    }

    await this.repository.update(id, updateFields);
    
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

    // Filter by position_id - check for truthy value
    if (criteria.position_id !== undefined && criteria.position_id !== null) {
      whereConditions.push(`e.position_id = $${paramIndex}`);
      whereParams.push(criteria.position_id);
      paramIndex++;
    }

    // Filter by account_ids array - check if array exists and has items
    if (criteria.account_ids !== undefined && Array.isArray(criteria.account_ids) && criteria.account_ids.length > 0) {
      whereConditions.push(`e.account_id = ANY($${paramIndex})`);
      whereParams.push(criteria.account_ids);
      paramIndex++;
    }

    // Search in employee_code, email, or full_name
    // Support both exact match (with diacritics) and fuzzy match (without diacritics)
    if (criteria.search && criteria.search.trim()) {
      const searchTerm = `%${criteria.search.trim()}%`;
      // Use ILIKE for case-insensitive search with Vietnamese diacritics
      whereConditions.push(`(
        e.employee_code ILIKE $${paramIndex} OR 
        e.email ILIKE $${paramIndex + 1} OR 
        e.full_name ILIKE $${paramIndex + 2}
      )`);
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
        p.position_name,
        p.suggested_role
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
      (employee as any).suggested_role = row.suggested_role;
      return employee;
    });

    return { employees, total };
  }
}