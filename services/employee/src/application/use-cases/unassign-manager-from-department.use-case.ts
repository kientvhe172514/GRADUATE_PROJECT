import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class UnassignManagerFromDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(departmentId: number): Promise<ApiResponseDto<DepartmentDetailDto>> {
    // Validate department exists
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      throw new DepartmentNotFoundException(departmentId);
    }

    // Check if department has a manager assigned
    if (!department.manager_id) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Department does not have a manager assigned',
        400
      );
    }

    // Update department - set manager_id to undefined to remove it
    const updatedDepartment = await this.departmentRepository.update(departmentId, {
      ...department,
      manager_id: undefined,
      updated_at: new Date(),
    });

    // Publish event
    this.eventPublisher.publish('department_manager_unassigned', {
      department_id: departmentId,
      previous_manager_id: department.manager_id,
      updated_at: new Date()
    });

    const result = new DepartmentDetailDto(updatedDepartment);

    return ApiResponseDto.success(
      result,
      'Manager unassigned from department successfully',
      200,
      undefined,
      'MANAGER_UNASSIGNED'
    );
  }
}
