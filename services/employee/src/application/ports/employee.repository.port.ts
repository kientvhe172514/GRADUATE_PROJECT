import { Employee } from '../../domain/entities/employee.entity';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

export interface EmployeeRepositoryPort {
  create(employee: Employee): Promise<Employee>;  
  findByCode(code: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findById(id: number): Promise<Employee | null>;
  update(id: number, employee: Partial<Employee>): Promise<Employee>;
  updateAccountId(id: number, accountId: number): Promise<void>;
  updateOnboardingStatus(id: number, status: string): Promise<void>;
}