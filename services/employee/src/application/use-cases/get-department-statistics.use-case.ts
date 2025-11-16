import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY } from '../tokens';
import { DepartmentNotFoundException } from '../../domain/exceptions/department-not-found.exception';
import { DepartmentStatisticsDto } from '../dto/department/department-statistics.dto';
import { Department } from '../../domain/entities/department.entity';

@Injectable()
export class GetDepartmentStatisticsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(departmentId: number): Promise<ApiResponseDto<DepartmentStatisticsDto>> {
    // Validate department exists
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      throw new DepartmentNotFoundException(departmentId);
    }

    // Get total employees count
    const totalEmployees = await this.departmentRepository.getEmployeeCountByDepartment(departmentId);

    // Get employees by status
    const employeesByStatusResult = await this.departmentRepository.getEmployeeCountByStatus(departmentId);

    const employeesByStatus = {
      ACTIVE: 0,
      INACTIVE: 0,
      TERMINATED: 0,
    };

    employeesByStatusResult.forEach((row) => {
      const status = row.status?.toUpperCase();
      if (status === 'ACTIVE') employeesByStatus.ACTIVE = row.count;
      else if (status === 'INACTIVE') employeesByStatus.INACTIVE = row.count;
      else if (status === 'TERMINATED') employeesByStatus.TERMINATED = row.count;
    });

    // Get employees by position
    const employeesByPosition = await this.departmentRepository.getEmployeeCountByPosition(departmentId);

    // Get sub-departments count
    const subDepartmentsCount = await this.departmentRepository.getSubDepartmentsCount(departmentId);

    // Get parent department info if exists
    let parentDepartment: Department | null = null;
    if (department.parent_department_id) {
      parentDepartment = await this.departmentRepository.findById(department.parent_department_id);
    }

    const response: DepartmentStatisticsDto = {
      department_id: department.id,
      department_code: department.department_code,
      department_name: department.department_name,
      total_employees: totalEmployees,
      employees_by_status: employeesByStatus,
      employees_by_position: employeesByPosition,
      sub_departments_count: subDepartmentsCount,
      parent_department_id: department.parent_department_id,
      parent_department_name: parentDepartment?.department_name,
    };

    return ApiResponseDto.success(
      response,
      'Department statistics retrieved successfully',
      200,
      undefined,
      'DEPARTMENT_STATISTICS_RETRIEVED',
    );
  }
}

