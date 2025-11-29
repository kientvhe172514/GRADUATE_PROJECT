import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { DEPARTMENT_REPOSITORY, EMPLOYEE_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';
import { IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignManagerToDepartmentDto {
  @ApiProperty({ description: 'Employee ID to assign as manager', example: 2 })
  @IsNumber()
  @IsPositive()
  manager_id: number;
}

@Injectable()
export class AssignManagerToDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(
    departmentId: number, 
    dto: AssignManagerToDepartmentDto
  ): Promise<ApiResponseDto<DepartmentDetailDto>> {
    // Validate department exists
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      throw new DepartmentNotFoundException(departmentId);
    }

    // Validate employee exists
    const employee = await this.employeeRepository.findById(dto.manager_id);
    if (!employee) {
      throw new EmployeeNotFoundException(dto.manager_id);
    }

    // Check if employee has position_id = 3 (Manager position)
    if (employee.position_id !== 3) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Employee must have Manager position (position_id = 3) to be assigned as department manager',
        400
      );
    }

    // Check if employee is ACTIVE
    if (employee.status !== 'ACTIVE') {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        'Only active employees can be assigned as department manager',
        400
      );
    }

    // Check if manager is already assigned to another department
    const { departments } = await this.departmentRepository.findWithPagination({
      status: 'ACTIVE',
      limit: 1000,
      offset: 0,
    });

    const alreadyAssignedDept = departments.find(
      dept => dept.manager_id === dto.manager_id && dept.id !== departmentId
    );

    if (alreadyAssignedDept) {
      throw new BusinessException(
        ErrorCodes.VALIDATION_ERROR,
        `Employee is already assigned as manager of department: ${alreadyAssignedDept.department_name}`,
        400
      );
    }

    // Update department with new manager
    const updatedDepartment = await this.departmentRepository.update(departmentId, {
      ...department,
      manager_id: dto.manager_id,
      updated_at: new Date()
    });

    // Also update employee's current department to this department
    await this.employeeRepository.update(dto.manager_id, {
      ...employee,
      department_id: departmentId,
      updated_at: new Date(),
    });

    // Publish event
    this.eventPublisher.publish('department_manager_assigned', {
      department_id: departmentId,
      manager_id: dto.manager_id,
      updated_at: new Date()
    });

    // Publish employee_department_assigned for downstream consumers (e.g., Auth)
    this.eventPublisher.publish('employee_department_assigned', {
      employee_id: dto.manager_id,
      department_id: departmentId,
      department_name: department.department_name,
      assigned_at: new Date(),
    });

    const result = new DepartmentDetailDto(updatedDepartment);

    return ApiResponseDto.success(
      result,
      'Manager assigned to department successfully',
      200,
      undefined,
      'MANAGER_ASSIGNED'
    );
  }
}
