import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { DepartmentRepositoryPort } from '../ports/department.repository.port';
import { EMPLOYEE_REPOSITORY, DEPARTMENT_REPOSITORY } from '../tokens';
import { 
  ListManagersDto, 
  ListManagersResponseDto, 
  ManagerSummaryDto 
} from '../dto/employee/manager-list.dto';
import { log } from 'console';

@Injectable()
export class GetManagersUseCase {
  private readonly logger = new Logger(GetManagersUseCase.name);

  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: DepartmentRepositoryPort,
    @Inject('IAM_SERVICE')
    private readonly iamServiceClient: ClientProxy,
  ) {}

  async execute(dto: ListManagersDto): Promise<ApiResponseDto<ListManagersResponseDto>> {
    // Step 1: Call IAM service to get all accounts with role_id = 3 (DEPARTMENT_MANAGER)
    let managerAccountIds: number[] = [];
    
    try {
      const response = await lastValueFrom(
        this.iamServiceClient
          .send<{ account_ids: number[] }>('get_accounts_by_role', { role_id: 3 })
          .pipe(timeout(5000)),
      );

      managerAccountIds = response?.account_ids ?? [];
      this.logger.log(`✅ Found ${managerAccountIds.length} accounts with role_id=3 (DEPARTMENT_MANAGER)`);
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error('Timeout while fetching manager accounts from IAM service');
      } else {
        const err = error as Error;
        this.logger.error(`Failed to fetch manager accounts: ${err.message}`, err.stack);
      }
      // Return empty list if IAM service call fails
      return ApiResponseDto.success(
        { managers: [], total: 0 },
        'Failed to fetch manager accounts from IAM service',
        200,
        undefined,
        'MANAGERS_RETRIEVED'
      );
    }

    // If no manager accounts found, return empty list
    if (managerAccountIds.length === 0) {
      this.logger.log('No manager accounts found');
      return ApiResponseDto.success(
        { managers: [], total: 0 },
        'No manager accounts found',
        200,
        undefined,
        'MANAGERS_RETRIEVED'
      );
    }

    // Step 2: Get all employees whose account_id is in the manager account list
    const searchCriteria: any = {
      status: 'ACTIVE',
      account_ids: managerAccountIds, // Filter by account_ids
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
    
    this.logger.log(`📊 Found ${total} employees with DEPARTMENT_MANAGER role and status=ACTIVE`);
    this.logger.log(`📋 Employee IDs found: ${employees.map((e: any) => e.id).join(', ')}`);
    this.logger.log(`📧 Employee details: ${JSON.stringify(employees.map((e: any) => ({ id: e.id, name: e.full_name, account_id: e.account_id })))}`);

    // Step 3: Get all departments to find already assigned manager_ids
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

    this.logger.log(`📍 Departments with assigned managers: ${Array.from(assignedManagerIds).length}`);
    this.logger.log(`📍 Assigned manager IDs: ${Array.from(assignedManagerIds).join(', ')}`);
    this.logger.log(`📍 Department details: ${JSON.stringify(departments.filter(d => d.manager_id).map(d => ({ dept_id: d.id, dept_name: d.department_name, manager_id: d.manager_id })))}`);

    // Step 4: Filter out employees who are already assigned as department managers
    const managers: ManagerSummaryDto[] = employees
      .filter((employee: any) => {
        const isAssigned = assignedManagerIds.has(employee.id);
        this.logger.log(`🔍 Employee ${employee.id} (${employee.full_name}) - Already assigned: ${isAssigned}`);
        return !isAssigned;
      })
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

    this.logger.log(`✅ Available managers (not assigned): ${managers.length}`);

    log("managers", managers);

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
