import { Injectable, Inject } from '@nestjs/common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EMPLOYEE_REPOSITORY } from '../tokens';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';
import { ListEmployeeDto } from '../dto/employee/list-employee.dto';

@Injectable()
export class GetEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(filters?: ListEmployeeDto): Promise<EmployeeDetailDto[]> {
    try {
      const employees = await this.employeeRepository.findAll(filters || {});
      return employees.map(employee => new EmployeeDetailDto(employee));
    } catch (error) {
      console.error('Error in GetEmployeesUseCase:', error);
      throw error;
    }
  }
}