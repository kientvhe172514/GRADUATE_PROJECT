import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, POSITION_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { PositionNotFoundException } from '../../domain/exceptions/position-not-found.exception';
import { AssignEmployeeToPositionDto } from '../dto/employee/assign-employee-to-position.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';

@Injectable()
export class AssignEmployeeToPositionUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(POSITION_REPOSITORY)
    private readonly positionRepository: PositionRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    employeeId: number,
    dto: AssignEmployeeToPositionDto,
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
        `Cannot assign inactive employee (status: ${employee.status}) to position`,
        400,
      );
    }

    // Validate position exists
    const position = await this.positionRepository.findById(dto.position_id);
    if (!position) {
      throw new PositionNotFoundException(dto.position_id);
    }

    // Validate position is ACTIVE
    if (position.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        `Cannot assign employee to inactive position (status: ${position.status})`,
        400,
      );
    }

    // Validate position belongs to employee's department (if employee has department)
    if (employee.department_id && position.department_id) {
      if (employee.department_id !== position.department_id) {
        throw new BusinessException(
          ErrorCodes.BAD_REQUEST,
          `Position does not belong to employee's department. Employee department: ${employee.department_id}, Position department: ${position.department_id}`,
          400,
        );
      }
    }

    // If employee already has a position, this is a transfer (allowed)
    const previousPositionId = employee.position_id;

    // Update employee's position
    const updatedEmployee = await this.employeeRepository.update(employeeId, {
      position_id: dto.position_id,
      updated_by: dto.assigned_by,
    });

    // Publish event
    const eventPayload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      from_position_id: previousPositionId || null,
      to_position_id: dto.position_id,
      suggested_role: position.suggested_role,
      assigned_by: dto.assigned_by,
      assigned_at: new Date(),
    };

    this.eventPublisher.publish('employee_position_assigned', eventPayload);

    // If position has suggested_role, trigger role assignment event
    if (position.suggested_role && employee.account_id) {
      this.eventPublisher.publish('employee_role_assigned', {
        employee_id: employeeId,
        account_id: employee.account_id,
        role: position.suggested_role,
        assigned_by: dto.assigned_by,
        assigned_at: new Date(),
      });
    }

    return ApiResponseDto.success(
      new EmployeeDetailDto(updatedEmployee),
      'Employee assigned to position successfully',
      200,
      undefined,
      'EMPLOYEE_POSITION_ASSIGNED',
    );
  }
}

