import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { EMPLOYEE_REPOSITORY, DEPARTMENT_REPOSITORY, POSITION_REPOSITORY } from '../tokens';
import { EmployeeNotFoundException } from '../../domain/exceptions/employee-not-found.exception';
import { EmployeeAssignmentDto } from '../dto/employee/employee-assignment.dto';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';
import { PositionResponseDto } from '../dto/position-response.dto';
import { EmployeeSummaryDto } from '../dto/employee/list-employee.dto';

@Injectable()
export class GetEmployeeAssignmentDetailsUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
    @Inject(POSITION_REPOSITORY)
    private readonly positionRepository: PositionRepositoryPort,
  ) {}

  async execute(employeeId: number): Promise<ApiResponseDto<EmployeeAssignmentDto>> {
    // Get employee
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new EmployeeNotFoundException(employeeId);
    }

    // Get department if assigned
    let department: DepartmentDetailDto | null = null;
    if (employee.department_id) {
      const dept = await this.departmentRepository.findById(employee.department_id);
      if (dept) {
        department = new DepartmentDetailDto(dept);
      }
    }

    // Get position if assigned
    let position: PositionResponseDto | null = null;
    if (employee.position_id) {
      const pos = await this.positionRepository.findById(employee.position_id);
      if (pos) {
        position = {
          id: pos.id,
          position_code: pos.position_code,
          position_name: pos.position_name,
          description: pos.description,
          level: pos.level,
          department_id: pos.department_id,
          suggested_role: pos.suggested_role,
          salary_min: pos.salary_min,
          salary_max: pos.salary_max,
          currency: pos.currency,
          status: pos.status,
          created_at: pos.created_at || new Date(),
          updated_at: pos.updated_at || new Date(),
        };
      }
    }

    // Get manager if assigned
    let manager: EmployeeSummaryDto | null = null;
    if (employee.manager_id) {
      const mgr = await this.employeeRepository.findById(employee.manager_id);
      if (mgr) {
        manager = {
          id: mgr.id!,
          employee_code: mgr.employee_code,
          full_name: mgr.full_name,
          email: mgr.email,
          phone: mgr.phone_number,
          department_id: mgr.department_id,
          department_name: undefined, // Would need to join if needed
          position_id: mgr.position_id,
          position_name: undefined, // Would need to join if needed
          status: mgr.status,
          onboarding_status: mgr.onboarding_status,
          created_at: mgr.created_at!,
          updated_at: mgr.updated_at!,
        };
      }
    }

    const response: EmployeeAssignmentDto = {
      employee: new EmployeeDetailDto(employee),
      department: department || null,
      position: position || null,
      manager: manager || null,
    };

    return ApiResponseDto.success(
      response,
      'Employee assignment details retrieved successfully',
      200,
      undefined,
      'EMPLOYEE_ASSIGNMENT_RETRIEVED',
    );
  }
}

