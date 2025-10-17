import { Inject, Injectable } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../tokens';
import { BusinessException } from './../../../../shared/src/common/exceptions/business.exception';
import { ErrorCodes } from './../../../../shared/src/common/enums/error-codes.enum';
import { ApiResponseDto } from './../../../../shared/src/common/dto/api-response.dto';

export class MyAccountResponseDto {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  employee_id?: number;
  employee_code?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  last_login_at?: Date;
  status: string;

  static from(account: Account): MyAccountResponseDto {
    const dto = new MyAccountResponseDto();
    dto.id = account.id!;
    dto.email = account.email;
    dto.role = account.role;
    dto.full_name = account.full_name;
    dto.employee_id = account.employee_id;
    dto.employee_code = account.employee_code;
    dto.department_id = account.department_id;
    dto.department_name = account.department_name;
    dto.position_id = account.position_id;
    dto.position_name = account.position_name;
    dto.last_login_at = account.last_login_at;
    dto.status = account.status;
    return dto;
  }
}

@Injectable()
export class GetMyAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(currentAccountId: number): Promise<ApiResponseDto<MyAccountResponseDto>> {
    const account = await this.accountRepo.findById(currentAccountId);
    if (!account) {
      throw new BusinessException(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        'Account not found',
      );
    }
    return ApiResponseDto.success(MyAccountResponseDto.from(account), 'Retrieved account');
  }
}


