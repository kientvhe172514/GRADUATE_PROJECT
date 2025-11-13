import { Injectable, Inject } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../../tokens';
import { GetAccountDetailResponseDto } from '../../dto/admin/get-account-detail.dto';

@Injectable()
export class GetAccountDetailUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
  ) {}

  async execute(accountId: number): Promise<ApiResponseDto<GetAccountDetailResponseDto>> {
    try {
      // Validate account ID
      if (!accountId || accountId <= 0) {
        throw new BusinessException(ErrorCodes.BAD_REQUEST, 'Invalid account ID');
      }

      // Get account details
      const account = await this.accountRepo.findById(accountId);
      if (!account) {
        throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, "Account not found");
      }

      // Map to response DTO
      const response: GetAccountDetailResponseDto = {
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
        last_login_ip: account.last_login_ip || null,
        failed_login_attempts: account.failed_login_attempts,
        locked_until: account.locked_until || null,
        created_at: account.created_at!,
        updated_at: account.updated_at!,
      };

      return ApiResponseDto.success(response, 'Account details retrieved successfully', 200, undefined, 'ACCOUNT_DETAIL_RETRIEVED');
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      throw new BusinessException(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to retrieve account details');
    }
  }
}
