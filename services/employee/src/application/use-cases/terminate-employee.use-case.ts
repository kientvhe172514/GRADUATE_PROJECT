import { Injectable, Inject } from '@nestjs/common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { TerminateEmployeeDto } from '../dto/employee/terminate-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';

@Injectable()
export class TerminateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: TerminateEmployeeDto): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new EmployeeNotFoundException(id);
    }

    const updatedEmployee = await this.employeeRepository.update(id, {
      status: 'TERMINATED',
      termination_date: new Date(dto.termination_date),
      termination_reason: dto.termination_reason,
    });

    this.eventPublisher.publish('employee_terminated', {
      employee_id: id,
      termination_date: dto.termination_date,
      termination_reason: dto.termination_reason,
    });

    return updatedEmployee;
  }
}