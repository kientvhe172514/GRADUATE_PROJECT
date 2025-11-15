import { Employee } from '../../domain/entities/employee.entity';
import { CreateEmployeeDto } from '../dto/employee/create-employee.dto';
import { ListEmployeeDto } from '../dto/employee/list-employee.dto';

export interface EmployeeRepositoryPort {
  create(employee: Employee): Promise<Employee>;  
  findByCode(code: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findById(id: number): Promise<Employee | null>;
  update(id: number, employee: Partial<Employee>): Promise<Employee>;
  updateAccountId(id: number, accountId: number): Promise<void>;
  updateOnboardingStatus(id: number, status: string): Promise<void>;
  findAll(filters?: ListEmployeeDto): Promise<Employee[]>;
  findWithPagination(criteria: any): Promise<{ employees: Employee[]; total: number }>;
}