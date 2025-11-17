import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { EmployeeRepositoryPort } from '../ports/employee.repository.port';
import { EMPLOYEE_REPOSITORY } from '../tokens';
import { 
  ListManagersDto, 
  ListManagersResponseDto, 
  ManagerSummaryDto 
} from '../dto/employee/manager-list.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GetManagersUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: EmployeeRepositoryPort,
    @Inject('IAM_SERVICE')
    private iamClient: ClientProxy,
  ) {}

  async execute(dto: ListManagersDto): Promise<ApiResponseDto<ListManagersResponseDto>> {
    // Step 1: Request accounts with role_id = 3 from Auth service
    let managerAccountIds: number[] = [];
    
    try {
      const response = await firstValueFrom(
        this.iamClient.send('get_accounts_by_role', { role_id: 3 })
      );
      managerAccountIds = response?.account_ids || [];
      
      if (managerAccountIds.length === 0) {
        // No managers found in Auth service
        return ApiResponseDto.success(
          { managers: [], total: 0 },
          'No managers found',
          200,
          undefined,
          'MANAGERS_RETRIEVED'
        );
      }
    } catch (error) {
      console.error('Error fetching accounts from Auth service:', error);
      // Fallback: return empty if Auth service is unavailable
      return ApiResponseDto.success(
        { managers: [], total: 0 },
        'Auth service unavailable',
        200,
        undefined,
        'MANAGERS_RETRIEVED'
      );
    }

    // Step 2: Get employees matching those account_ids
    const searchCriteria: any = {
      status: 'ACTIVE',
      search: dto.search,
      limit: 1000,
      offset: 0,
      sortBy: 'full_name',
      sortOrder: 'ASC',
    };

    // Add filters if provided
    if (dto.department_id !== undefined && dto.department_id !== null) {
      searchCriteria.department_id = dto.department_id;
    }

    if (dto.position_id !== undefined && dto.position_id !== null) {
      searchCriteria.position_id = dto.position_id;
    }

    const { employees, total } = await this.employeeRepository.findWithPagination(searchCriteria);

    // Step 3: Filter employees by account_ids from Auth service
    const managers: ManagerSummaryDto[] = employees
      .filter((employee: any) => {
        return employee.account_id && managerAccountIds.includes(employee.account_id);
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
