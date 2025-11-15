import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { AssignEmployeeToDepartmentDto } from '../dto/employee/assign-employee-to-department.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';

@Injectable()
export class AssignEmployeeToDepartmentUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    employeeId: number,
    dto: AssignEmployeeToDepartmentDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    // Validate employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new EmployeeNotFoundException(employeeId);
    }

    // Validate employee is ACTIVE
    if (employee.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot assign inactive employee (status: ${employee.status}) to department`,
        400,
      );
    }

    // Validate department exists
    const department = await this.departmentRepository.findById(dto.department_id);
    if (!department) {
      throw new DepartmentNotFoundException(dto.department_id);
    }

    // Validate department is ACTIVE
    if (department.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot assign employee to inactive department (status: ${department.status})`,
        400,
      );
    }

    // If employee already has a department, this is a transfer (allowed)
    const previousDepartmentId = employee.department_id;

    // Update employee's department
    const updatedEmployee = await this.employeeRepository.update(employeeId, {
      department_id: dto.department_id,
      updated_by: dto.assigned_by,
    });

    // Publish event
    const eventPayload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      from_department_id: previousDepartmentId || null,
      to_department_id: dto.department_id,
      assigned_by: dto.assigned_by,
      assigned_at: new Date(),
    };

    this.eventPublisher.publish('employee_department_assigned', eventPayload);

    return ApiResponseDto.success(
      new EmployeeDetailDto(updatedEmployee),
      'Employee assigned to department successfully',
      200,
      undefined,
      'EMPLOYEE_DEPARTMENT_ASSIGNED',
    );
  }
}

