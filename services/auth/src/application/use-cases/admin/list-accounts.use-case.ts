import { Injectable, Inject } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../../tokens';
import {
  ListAccountsRequestDto,
  ListAccountsResponseDto,
  AccountSummaryDto,
  PaginationDto,
} from '../../dto/admin/list-accounts.dto';

@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
  ) {}

  async execute(
    dto: ListAccountsRequestDto,
  ): Promise<ApiResponseDto<ListAccountsResponseDto>> {
    try {
      // Debug: Log incoming DTO
      console.log(
        '🔍 ListAccountsUseCase - Incoming DTO:',
        JSON.stringify(dto, null, 2),
      );
      console.log('🔍 dto.status:', dto.status, 'type:', typeof dto.status);
      console.log('🔍 dto.role:', dto.role, 'type:', typeof dto.role);
      console.log(
        '🔍 dto.department_id:',
        dto.department_id,
        'type:',
        typeof dto.department_id,
      );

      // Validate pagination parameters
      const page = Math.max(1, dto.page || 1);
      const limit = Math.min(100, Math.max(1, dto.limit || 10));
      const offset = (page - 1) * limit;

      // Build search criteria - explicitly check for values
      const searchCriteria: any = {};

      if (
        dto.status !== undefined &&
        dto.status !== null &&
        dto.status !== ''
      ) {
        searchCriteria.status = dto.status;
        console.log('✅ Status filter added:', searchCriteria.status);
      } else {
        console.log('❌ Status filter NOT added. dto.status:', dto.status);
      }

      if (dto.role !== undefined && dto.role !== null && dto.role !== '') {
        searchCriteria.role = dto.role;
        console.log('✅ Role filter added:', searchCriteria.role);
      }

      if (dto.department_id !== undefined && dto.department_id !== null) {
        searchCriteria.department_id = dto.department_id;
        console.log(
          '✅ Department ID filter added:',
          searchCriteria.department_id,
        );
      }

      console.log(
        '🔍 Final searchCriteria:',
        JSON.stringify(searchCriteria, null, 2),
      );

      // Get accounts with pagination
      const criteria = {
        ...searchCriteria,
        search: dto.search,
        limit,
        offset,
        sortBy: dto.sort_by || 'created_at',
        sortOrder: dto.sort_order || 'DESC',
      };

      console.log(
        '🔍 Criteria passed to repository:',
        JSON.stringify(criteria, null, 2),
      );

      const { accounts, total } =
        await this.accountRepo.findWithPagination(criteria);

      // Map to DTOs
      const accountSummaries: AccountSummaryDto[] = accounts.map((account) => ({
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

      return ApiResponseDto.success(
        response,
        'Accounts retrieved successfully',
        200,
        undefined,
        'ACCOUNTS_RETRIEVED',
      );
    } catch (error) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to retrieve accounts',
      );
    }
  }
}
