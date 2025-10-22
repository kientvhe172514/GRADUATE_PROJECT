import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { CreateEmployeeResponseDto } from '../dto/employee/create-employee-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { CreateEmployeeDto } from '../dto/employee/create-employee.dto';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeCreatedEventDto } from '../dto/employee/employee-created.event.dto';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<ApiResponseDto<CreateEmployeeResponseDto>> {
    const existingByCode = await this.employeeRepository.findByCode(dto.employee_code);
    if (existingByCode) {
      throw new BusinessException(ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS);
    }

    const existingByEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new BusinessException(ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS);
    }

    const employee = new Employee();
    Object.assign(employee, dto);
    employee.full_name = `${dto.first_name} ${dto.last_name}`;

    const savedEmployee = await this.employeeRepository.create(employee); 
    const response: CreateEmployeeResponseDto = {
      id: savedEmployee.id!,
      account_id: savedEmployee.account_id,
      employee_code: savedEmployee.employee_code,
      full_name: savedEmployee.full_name,
      email: savedEmployee.email,
      hire_date: savedEmployee.hire_date,
      onboarding_status: savedEmployee.onboarding_status,
      created_at: savedEmployee.created_at!,
    };

    const eventDto = new EmployeeCreatedEventDto(savedEmployee);
    this.eventPublisher.publish('employee_created', eventDto);

    return ApiResponseDto.success(response, 'Employee created', 201, undefined, 'EMPLOYEE_CREATED');
  }
}