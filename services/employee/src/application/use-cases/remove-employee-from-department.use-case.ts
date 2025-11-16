import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { RemoveEmployeeFromDepartmentDto } from '../dto/employee/remove-employee-from-department.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';

@Injectable()
export class RemoveEmployeeFromDepartmentUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    employeeId: number,
    dto: RemoveEmployeeFromDepartmentDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    // Validate employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new EmployeeNotFoundException(employeeId);
    }

    // Check if employee has a department
    if (!employee.department_id) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Employee is not assigned to any department',
        400,
      );
    }

    const previousDepartmentId = employee.department_id;

    // Check if employee has a position that belongs to the department
    // Note: This is a warning, not a blocker. Position will remain but may become invalid.
    // In a real scenario, you might want to remove position as well or show a warning.

    // Update employee: remove department assignment
    const updatedEmployee = await this.employeeRepository.update(employeeId, {
      department_id: undefined,
      updated_by: dto.removed_by,
    });

    // Publish event
    const eventPayload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      department_id: previousDepartmentId,
      removed_by: dto.removed_by,
      reason: dto.reason,
      removed_at: new Date(),
    };

    this.eventPublisher.publish('employee_department_removed', eventPayload);

    return ApiResponseDto.success(
      new EmployeeDetailDto(updatedEmployee),
      'Employee removed from department successfully',
      200,
      undefined,
      'EMPLOYEE_DEPARTMENT_REMOVED',
    );
  }
}

