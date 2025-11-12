import { Injectable, Inject } from '@nestjs/common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ACCOUNT_REPOSITORY } from '../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { GetAccountResponseDto } from '../dto/get-account-response.dto';

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepository: AccountRepositoryPort,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }
    
    const dto: GetAccountResponseDto = {
      id: account.id!,
      email: account.email,
      full_name: account.full_name,
      role: account.role || '',
      status: account.status,
      employee_id: account.employee_id,
      employee_code: account.employee_code,
      department_id: account.department_id,
      department_name: account.department_name,
      position_id: account.position_id,
      position_name: account.position_name,
      last_login_at: account.last_login_at,
      last_login_ip: account.last_login_ip,
      created_at: account.created_at,
      updated_at: account.updated_at,
    };
    
    return ApiResponseDto.success(dto, 'Account retrieved');
  }

  async executeByEmail(email: string): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }
    
    const dto: GetAccountResponseDto = {
      id: account.id!,
      email: account.email,
      full_name: account.full_name,
      role: account.role || '',
      status: account.status,
      employee_id: account.employee_id,
      employee_code: account.employee_code,
      department_id: account.department_id,
      department_name: account.department_name,
      position_id: account.position_id,
      position_name: account.position_name,
      last_login_at: account.last_login_at,
      last_login_ip: account.last_login_ip,
      created_at: account.created_at,
      updated_at: account.updated_at,
    };
    
    return ApiResponseDto.success(dto, 'Account retrieved');
  }

  async executeByEmployeeId(employeeId: number): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findByEmployeeId(employeeId);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }
    
    const dto: GetAccountResponseDto = {
      id: account.id!,
      email: account.email,
      full_name: account.full_name,
      role: account.role || '',
      status: account.status,
      employee_id: account.employee_id,
      employee_code: account.employee_code,
      department_id: account.department_id,
      department_name: account.department_name,
      position_id: account.position_id,
      position_name: account.position_name,
      last_login_at: account.last_login_at,
      last_login_ip: account.last_login_ip,
      created_at: account.created_at,
      updated_at: account.updated_at,
    };
    
    return ApiResponseDto.success(dto, 'Account retrieved');
  }
}
