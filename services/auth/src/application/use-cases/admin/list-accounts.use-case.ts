import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../../tokens';
import { 
  ListAccountsRequestDto, 
  ListAccountsResponseDto, 
  AccountSummaryDto, 
  PaginationDto 
} from '../../dto/admin/list-accounts.dto';

@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
  ) {}

  async execute(dto: ListAccountsRequestDto): Promise<ApiResponseDto<ListAccountsResponseDto>> {
    try {
      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria
      const searchCriteria: any = {};
      
      if (dto.status) {
        searchCriteria.status = dto.status;
      }
      
      if (dto.role) {
        searchCriteria.role = dto.role;
      }
      
      if (dto.department_id) {
        searchCriteria.department_id = dto.department_id;
      }

      // Get accounts with pagination
      const { accounts, total } = await this.accountRepo.findWithPagination({
        ...searchCriteria,
        search: dto.search,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      });

      // Map to DTOs
      const accountSummaries: AccountSummaryDto[] = accounts.map(account => ({
        id: account.id!,
        email: account.email,
        full_name: account.full_name || '',
        role: account.role || '',
        status: account.status,
        department_id: account.department_id || 0,
        department_name: account.department_name || '',
        position_id: account.position_id || 0,
        position_name: account.position_name || '',
        employee_id: account.employee_id || 0,
        employee_code: account.employee_code || '',
        last_login_at: account.last_login_at || null,
        created_at: account.created_at!,
        updated_at: account.updated_at!,
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

      const response: ListAccountsResponseDto = {
        accounts: accountSummaries,
        pagination,
      };

      return ApiResponseDto.success(response, 'Accounts retrieved successfully', 200, undefined, 'ACCOUNTS_RETRIEVED');
    } catch (error) {
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve accounts');
    }
  }
}
