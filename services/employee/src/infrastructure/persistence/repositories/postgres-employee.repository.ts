import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeSchema } from '../typeorm/employee.schema';
import { EmployeeRepositoryPort } from '../../../application/ports/employee.repository.port';
import { Employee } from '../../../domain/entities/employee.entity';
import { CreateEmployeeDto } from '../../../application/dto/create-employee.dto';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeMapper } from '../mappers/employee.mapper';

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

  async updateAccountId(id: number, accountId: number): Promise<void> {
    await this.repository.update(id, { account_id: accountId });
  }

  async updateOnboardingStatus(id: number, status: string): Promise<void> {
    await this.repository.update(id, { onboarding_status: status });
  }
}