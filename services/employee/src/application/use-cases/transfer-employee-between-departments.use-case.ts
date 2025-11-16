import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, DEPARTMENT_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { TransferEmployeeBetweenDepartmentsDto } from '../dto/employee/transfer-employee-between-departments.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';

@Injectable()
export class TransferEmployeeBetweenDepartmentsUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject(POSITION_REPOSITORY)
    private readonly positionRepository: PositionRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    employeeId: number,
    dto: TransferEmployeeBetweenDepartmentsDto,
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
        `Cannot transfer inactive employee (status: ${employee.status})`,
        400,
      );
    }

    // Validate employee has a current department
    if (!employee.department_id) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Employee is not assigned to any department. Use assign instead of transfer.',
        400,
      );
    }

    const fromDepartmentId = employee.department_id;

    // Validate target department exists
    const toDepartment = await this.departmentRepository.findById(dto.to_department_id);
    if (!toDepartment) {
      throw new DepartmentNotFoundException(dto.to_department_id);
    }

    // Validate target department is ACTIVE
    if (toDepartment.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot transfer employee to inactive department (status: ${toDepartment.status})`,
        400,
      );
    }

    // Check if transferring to the same department
    if (fromDepartmentId === dto.to_department_id) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Employee is already in this department',
        400,
      );
    }

    // If employee has a position, validate position can belong to new department
    let positionRemoved = false;
    if (employee.position_id) {
      const position = await this.positionRepository.findById(employee.position_id);
      if (position && position.department_id !== dto.to_department_id) {
        // Position doesn't belong to new department, remove it
        // In a real scenario, you might want to show a warning or require explicit confirmation
        positionRemoved = true;
      }
    }

    // Update employee's department (and position if needed)
    const updateData: any = {
      department_id: dto.to_department_id,
      updated_by: dto.transferred_by,
    };

    if (positionRemoved) {
      updateData.position_id = null;
    }

    const updatedEmployee = await this.employeeRepository.update(employeeId, updateData);

    // Publish event
    const eventPayload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      from_department_id: fromDepartmentId,
      to_department_id: dto.to_department_id,
      position_removed: positionRemoved,
      previous_position_id: positionRemoved ? employee.position_id : null,
      transferred_by: dto.transferred_by,
      effective_date: dto.effective_date ? new Date(dto.effective_date) : new Date(),
      transferred_at: new Date(),
    };

    this.eventPublisher.publish('employee_department_transferred', eventPayload);

    return ApiResponseDto.success(
      new EmployeeDetailDto(updatedEmployee),
      positionRemoved
        ? 'Employee transferred to department successfully. Position was removed as it does not belong to the new department.'
        : 'Employee transferred to department successfully',
      200,
      undefined,
      'EMPLOYEE_DEPARTMENT_TRANSFERRED',
    );
  }
}

