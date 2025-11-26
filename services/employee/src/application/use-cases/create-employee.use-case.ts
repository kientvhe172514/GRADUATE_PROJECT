import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeCreatedEventDto } from '../dto/employee/employee-created.event.dto';
import { CreateEmployeeDto } from 'application/dto/employee/create-employee.dto';
import { CreateEmployeeResponseDto } from 'application/dto/employee/create-employee-response.dto';

@Injectable()
export class CreateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(POSITION_REPOSITORY)
    private positionRepository: PositionRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<ApiResponseDto<CreateEmployeeResponseDto>> {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      throw new BusinessException('INVALID_EMAIL_FORMAT', 'Invalid email format', 400);
    }

    // Validate personal_email format if provided
    if (dto.personal_email && !emailRegex.test(dto.personal_email)) {
      throw new BusinessException('INVALID_EMAIL_FORMAT', 'Invalid personal email format', 400);
    }

    // Validate phone number format (10 digits)
    if (dto.phone_number && dto.phone_number.trim() !== '') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(dto.phone_number.trim())) {
        throw new BusinessException('INVALID_PHONE_NUMBER', 'Phone number must be exactly 10 digits', 400);
      }
    }

    // Auto-generate employee_code if not provided
    if (!dto.employee_code) {
      dto.employee_code = await this.generateEmployeeCode();
      console.log(`✅ Auto-generated employee_code: ${dto.employee_code}`);
    }

    const existingByCode = await this.employeeRepository.findByCode(dto.employee_code);
    if (existingByCode) {
      throw new BusinessException(ErrorCodes.EMPLOYEE_CODE_ALREADY_EXISTS, 'Employee code already exists');
    }

    const existingByEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new BusinessException(ErrorCodes.EMPLOYEE_EMAIL_ALREADY_EXISTS, 'Employee email already exists');
    }

    const employee = new Employee();
    Object.assign(employee, dto);
    employee.full_name = `${dto.first_name} ${dto.last_name}`;

    const savedEmployee = await this.employeeRepository.create(employee);
    
    // Fetch position to get suggested_role for RBAC
    let suggestedRole = 'EMPLOYEE'; // Default role
    if (savedEmployee.position_id) {
      const position = await this.positionRepository.findById(savedEmployee.position_id);
      if (position && position.suggested_role) {
        suggestedRole = position.suggested_role;
        console.log(`✅ Assigned role "${suggestedRole}" from position "${position.position_name}" to employee ${savedEmployee.id}`);
      }
    }

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

    const eventDto = new EmployeeCreatedEventDto(savedEmployee, suggestedRole);
    this.eventPublisher.publish('employee_created', eventDto);

    return ApiResponseDto.success(response, 'Employee created', 201, undefined, 'EMPLOYEE_CREATED');
  }

  /**
   * Auto-generate employee code in format: EMP + YYYYMMDD + XXX
   * Example: EMP20251126001
   */
  private async generateEmployeeCode(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    // Find the highest sequence number for today
    const existingCodes = await this.employeeRepository.findAll();
    const todayCodes = existingCodes
      .filter(emp => emp.employee_code?.startsWith(`EMP${datePrefix}`))
      .map(emp => {
        const match = emp.employee_code?.match(/EMP\d{8}(\d{3})$/);
        return match ? parseInt(match[1], 10) : 0;
      });
    
    const maxSequence = todayCodes.length > 0 ? Math.max(...todayCodes) : 0;
    const nextSequence = String(maxSequence + 1).padStart(3, '0');
    
    return `EMP${datePrefix}${nextSequence}`;
  }
}