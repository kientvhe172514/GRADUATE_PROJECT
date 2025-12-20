import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';

@Injectable()
export class UnassignManagerFromDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
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

    // Update department - set manager_id to undefined (will be stored as NULL in DB)
    const updatedDepartment = await this.departmentRepository.update(departmentId, {
      manager_id: undefined,
      updated_at: new Date(),
    });

    // Also clear manager's department assignment (set employee.department_id to undefined -> NULL)
    // This removes the manager from the department entirely
    if (department.manager_id) {
      const manager = await this.employeeRepository.findById(department.manager_id);
      if (manager && manager.department_id === departmentId) {
        // Only clear if manager's current department matches the one being unassigned
        await this.employeeRepository.update(department.manager_id, {
          department_id: undefined, // Employee repo handles undefined -> null conversion
          updated_at: new Date(),
        });
      }
    }

    // Publish event
    this.eventPublisher.publish('department_manager_unassigned', {
      department_id: departmentId,
      previous_manager_id: department.manager_id,
      updated_at: new Date()
    });

    // Publish employee_department_removed for downstream consumers (e.g., Auth)
    this.eventPublisher.publish('employee_department_removed', {
      employee_id: department.manager_id,
      previous_department_id: departmentId,
      removed_at: new Date(),
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
