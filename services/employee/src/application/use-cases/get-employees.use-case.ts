import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EMPLOYEE_REPOSITORY } from '../tokens';
import { EmployeeDetailDto } from '../dto/employee/employee-detail.dto';
import { 
  ListEmployeeDto, 
  ListEmployeeResponseDto, 
  EmployeeSummaryDto, 
  PaginationDto 
} from '../dto/employee/list-employee.dto';

@Injectable()
export class GetEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
  ) {}

  async execute(dto: ListEmployeeDto): Promise<ApiResponseDto<ListEmployeeResponseDto>> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria - explicitly check for values
      const searchCriteria: any = {};
      
      if (dto.department_id !== undefined && dto.department_id !== null) {
        searchCriteria.department_id = dto.department_id;
      }
      
      if (dto.status !== undefined && dto.status !== null && dto.status !== '') {
        searchCriteria.status = dto.status;
      }

      // Get employees with pagination
      const criteria = {
        ...searchCriteria,
        search: dto.search,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      };
      
      const { employees, total } = await this.employeeRepository.findWithPagination(criteria);

      // Map to DTOs
      const employeeSummaries: EmployeeSummaryDto[] = employees.map((employee: any) => ({
        id: employee.id!,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        email: employee.email,
        phone: employee.phone_number,
        department_id: employee.department_id,
        department_name: employee.department_name || null,
        position_id: employee.position_id,
        position_name: employee.position_name || null,
        status: employee.status,
        onboarding_status: employee.onboarding_status,
        created_at: employee.created_at!,
        updated_at: employee.updated_at!,
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

      const response: ListEmployeeResponseDto = {
        employees: employeeSummaries,
        pagination,
      };

      return ApiResponseDto.success(response, 'Employees retrieved successfully', 200, undefined, 'EMPLOYEES_RETRIEVED');
    } catch (error) {
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve employees');
    }
  }
}