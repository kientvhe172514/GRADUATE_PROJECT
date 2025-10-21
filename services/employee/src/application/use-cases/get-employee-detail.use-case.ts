import { Injectable, Inject } from '@nestjs/common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EMPLOYEE_REPOSITORY } from '../tokens';
import { EmployeeDetailDto } from '../dto/employee-detail.dto';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';

@Injectable()
export class GetEmployeeDetailUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(id: number): Promise<EmployeeDetailDto> {
    const employee = await this.employeeRepository.findById(id);
    
    if (!employee) {
      throw new EmployeeNotFoundException(id);
    }

    return new EmployeeDetailDto(employee);
  }
}