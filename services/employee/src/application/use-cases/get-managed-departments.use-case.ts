import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY } from '../tokens';

/**
 * ✅ QUY TẮC: Use Case Pattern
 * Purpose: Get list of department IDs managed by a specific employee (DEPARTMENT_MANAGER role)
 * Input: employee_id (number)
 * Output: ApiResponseDto<{ department_ids: number[] }>
 * Business Logic: Query departments table WHERE manager_id = employee_id
 */

export interface GetManagedDepartmentsInput {
  employee_id: number;
}

export interface GetManagedDepartmentsOutput {
  department_ids: number[];
}

@Injectable()
export class GetManagedDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private readonly departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(
    input: GetManagedDepartmentsInput,
  ): Promise<ApiResponseDto<GetManagedDepartmentsOutput>> {
    try {
      const { employee_id } = input;

      // Validate employee_id
      if (!employee_id || employee_id <= 0) {
        throw new BusinessException(
          ErrorCodes.INVALID_INPUT,
          'Invalid employee_id provided',
        );
      }

      // Get all departments managed by this employee
      const departments = await this.departmentRepository.findByManagerId(
        employee_id,
      );

      // Extract department IDs
      const departmentIds: number[] = departments
        .filter((dept) => dept.id !== undefined && dept.id !== null)
        .map((dept) => dept.id!);

      const output: GetManagedDepartmentsOutput = {
        department_ids: departmentIds,
      };

      return ApiResponseDto.success(
        output,
        `Retrieved ${departmentIds.length} managed departments`,
        200,
        undefined,
        'MANAGED_DEPARTMENTS_RETRIEVED',
      );
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve managed departments',
      );
    }
  }
}
