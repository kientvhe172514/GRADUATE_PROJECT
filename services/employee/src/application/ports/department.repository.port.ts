import { Department } from '../../domain/entities/department.entity';

export interface DepartmentRepositoryPort {
  create(department: Department): Promise<Department>;
  findByCode(code: string): Promise<Department | null>;
  findById(id: number): Promise<Department | null>;
  update(id: number, department: Partial<Department>): Promise<Department>;
  findAll(): Promise<Department[]>;
  findWithPagination(criteria: any): Promise<{ departments: Department[]; total: number }>;
  delete(id: number): Promise<void>;
}