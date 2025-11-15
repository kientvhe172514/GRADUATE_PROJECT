import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { DEPARTMENT_REPOSITORY } from '../tokens';
import { DepartmentDetailDto } from '../dto/department/department-detail.dto';
import { 
  ListDepartmentDto, 
  ListDepartmentResponseDto, 
  DepartmentSummaryDto, 
  PaginationDto 
} from '../dto/department/list-department.dto';

@Injectable()
export class GetDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(dto: ListDepartmentDto): Promise<ApiResponseDto<ListDepartmentResponseDto>> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria - explicitly check for values
      const searchCriteria: any = {};
      
      if (dto.status !== undefined && dto.status !== null && dto.status !== '') {
        searchCriteria.status = dto.status;
      }
      
      if (dto.parent_department_id !== undefined && dto.parent_department_id !== null) {
        searchCriteria.parent_department_id = dto.parent_department_id;
      }

      // Get departments with pagination
      const criteria = {
        ...searchCriteria,
        search: dto.search,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      };
      
      const { departments, total } = await this.departmentRepository.findWithPagination(criteria);

      // Map to DTOs
      const departmentSummaries: DepartmentSummaryDto[] = departments.map(department => ({
        id: department.id!,
        department_code: department.department_code,
        department_name: department.department_name,
        description: department.description,
        parent_department_id: department.parent_department_id,
        parent_department_name: department.parent_department_name,
        level: department.level,
        manager_id: department.manager_id,
        status: department.status,
        created_at: department.created_at!,
        updated_at: department.updated_at!,
      }));

      // Build pagination info
      const totalPages = Math.ceil(total / limit);
      const pagination: PaginationDto = {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      };

      const response: ListDepartmentResponseDto = {
        departments: departmentSummaries,
        pagination,
      };

      return ApiResponseDto.success(response, 'Departments retrieved successfully', 200, undefined, 'DEPARTMENTS_RETRIEVED');
    } catch (error) {
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve departments');
    }
  }
}