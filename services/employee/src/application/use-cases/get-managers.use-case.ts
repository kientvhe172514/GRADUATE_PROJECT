import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EMPLOYEE_REPOSITORY, DEPARTMENT_REPOSITORY } from '../tokens';
import { 
  ListManagersDto, 
  ListManagersResponseDto, 
  ManagerSummaryDto 
} from '../dto/employee/manager-list.dto';

@Injectable()
export class GetManagersUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
  ) {}

  async execute(dto: ListManagersDto): Promise<ApiResponseDto<ListManagersResponseDto>> {
    // Step 1: Get all employees with position_id = 3 (Manager position)
    const searchCriteria: any = {
      status: 'ACTIVE',
      position_id: 3, // Manager position
      search: dto.search,
      limit: 1000,
      offset: 0,
      sortBy: 'full_name',
      sortOrder: 'ASC',
    };

    // Add additional filters if provided
    if (dto.department_id !== undefined && dto.department_id !== null) {
      searchCriteria.department_id = dto.department_id;
    }

    const { employees, total } = await this.employeeRepository.findWithPagination(searchCriteria);
    
    console.log(`📊 Found ${total} employees with position_id=3 and status=ACTIVE`);
    console.log(`📋 Employees:`, employees.map((e: any) => ({ id: e.id, name: e.full_name, status: e.status, position_id: e.position_id })));

    // Step 2: Get all departments to find already assigned manager_ids
    const { departments } = await this.departmentRepository.findWithPagination({
      status: 'ACTIVE',
      limit: 1000,
      offset: 0,
    });

    // Extract unique assigned manager_ids from departments
    const assignedManagerIds = new Set(
      departments
        .filter((dept) => dept.manager_id)
        .map((dept) => dept.manager_id!)
    );

    console.log(`📍 Departments with assigned managers:`, Array.from(assignedManagerIds));

    // Step 3: Filter out employees who are already assigned as department managers
    const managers: ManagerSummaryDto[] = employees
      .filter((employee: any) => !assignedManagerIds.has(employee.id))
      .map((employee: any) => ({
        id: employee.id!,
        employee_code: employee.employee_code,
        full_name: employee.full_name,
        email: employee.email,
        department_id: employee.department_id,
        department_name: employee.department_name || null,
        position_id: employee.position_id,
        position_name: employee.position_name || null,
      }))
      .slice(0, 100); // Limit to 100 results

    console.log(`✅ Available managers (not assigned): ${managers.length}`);

    const response: ListManagersResponseDto = {
      managers,
      total: managers.length,
    };

    return ApiResponseDto.success(
      response, 
      'Managers retrieved successfully', 
      200, 
      undefined, 
      'MANAGERS_RETRIEVED'
    );
  }
}
