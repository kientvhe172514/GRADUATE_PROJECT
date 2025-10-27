import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
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
    const whereClause: any = {};
    
    if (filters?.department_id) {
      whereClause.department_id = filters.department_id;
    }
    
    if (filters?.status) {
      whereClause.status = filters.status;
    }
    
    if (filters?.search) {
      whereClause.full_name = Like(`%${filters.search}%`);
    }

    const employees = await this.repository.find({
      where: whereClause,
      order: {
        created_at: 'DESC',
      },
    });

    return employees.map(employee => EmployeeMapper.toDomain(employee));
  }
}