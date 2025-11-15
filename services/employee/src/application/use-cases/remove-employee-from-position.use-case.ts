import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { RemoveEmployeeFromPositionDto } from '../dto/employee/remove-employee-from-position.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';

@Injectable()
export class RemoveEmployeeFromPositionUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    employeeId: number,
    dto: RemoveEmployeeFromPositionDto,
  ): Promise<ApiResponseDto<EmployeeDetailDto>> {
    // Validate employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new EmployeeNotFoundException(employeeId);
    }

    // Check if employee has a position
    if (!employee.position_id) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Employee is not assigned to any position',
        400,
      );
    }

    const previousPositionId = employee.position_id;

    // Update employee: remove position assignment
    const updatedEmployee = await this.employeeRepository.update(employeeId, {
      position_id: undefined,
      updated_by: dto.removed_by,
    });

    // Publish event
    const eventPayload = {
      employee_id: employeeId,
      account_id: employee.account_id,
      position_id: previousPositionId,
      removed_by: dto.removed_by,
      reason: dto.reason,
      removed_at: new Date(),
    };

    this.eventPublisher.publish('employee_position_removed', eventPayload);

    return ApiResponseDto.success(
      new EmployeeDetailDto(updatedEmployee),
      'Employee removed from position successfully',
      200,
      undefined,
      'EMPLOYEE_POSITION_REMOVED',
    );
  }
}

