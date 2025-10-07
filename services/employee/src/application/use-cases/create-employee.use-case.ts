import { Injectable, Inject } from '@nestjs/common';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeCreatedEventDto } from '../dto/employee-created.event.dto';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<Employee> {
    const existingByCode = await this.employeeRepository.findByCode(dto.employee_code);
    if (existingByCode) {
      throw new Error('Employee code already exists');
    }

    const existingByEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new Error('Employee email already exists');
    }

    const employee = new Employee();
    Object.assign(employee, dto);
    employee.full_name = `${dto.first_name} ${dto.last_name}`;

    const savedEmployee = await this.employeeRepository.create(employee);  // SỬA: Pass Employee (port updated below)

    const eventDto = new EmployeeCreatedEventDto(savedEmployee);
    this.eventPublisher.publish('employee_created', eventDto);

    return savedEmployee;
  }
}