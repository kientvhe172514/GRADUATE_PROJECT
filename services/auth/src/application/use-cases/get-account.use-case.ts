import { Injectable, Inject, Logger } from '@nestjs/common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { ACCOUNT_REPOSITORY, EMPLOYEE_PROFILE_SERVICE, EVENT_PUBLISHER } from '../tokens';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { GetAccountResponseDto } from '../dto/get-account-response.dto';
import { EmployeeProfileServicePort } from '../ports/employee-profile.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { Account } from '../../domain/entities/account.entity';

@Injectable()
export class GetAccountUseCase {
  private readonly logger = new Logger(GetAccountUseCase.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepository: AccountRepositoryPort,
    @Inject(EMPLOYEE_PROFILE_SERVICE)
    private readonly employeeProfileService: EmployeeProfileServicePort,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }

    const dto = await this.buildResponse(account);
    this.publishProfileViewedEvent(account, dto);
    return ApiResponseDto.success(dto, 'Account retrieved');
  }

  async executeByEmail(email: string): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findByEmail(email);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }

    const dto = await this.buildResponse(account);
    return ApiResponseDto.success(dto, 'Account retrieved');
  }

  async executeByEmployeeId(employeeId: number): Promise<ApiResponseDto<GetAccountResponseDto>> {
    const account = await this.accountRepository.findByEmployeeId(employeeId);
    if (!account) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND, 'Account not found');
    }

    const dto = await this.buildResponse(account);
    return ApiResponseDto.success(dto, 'Account retrieved');
  }

  private async buildResponse(account: Account): Promise<GetAccountResponseDto> {
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
      phone: null,
      address: null,
      dateOfBirth: null,
    };

    if (account.employee_id) {
      try {
        const profile = await this.employeeProfileService.getEmployeeById(
          Number(account.employee_id),
        );
        if (profile) {
          dto.phone = profile.phone ?? null;
          dto.address = profile.address ?? null;
          dto.dateOfBirth = profile.dateOfBirth ?? null;
        }
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Failed to enrich account ${account.id} with employee profile: ${err.message}`,
          err.stack,
        );
      }
    }

    return dto;
  }

  private publishProfileViewedEvent(account: Account, dto: GetAccountResponseDto): void {
    try {
      this.eventPublisher.publish('auth.account.profile_viewed', {
        account_id: account.id,
        employee_id: account.employee_id,
        timestamp: new Date().toISOString(),
        metadata: {
          has_employee_profile: !!dto.phone || !!dto.address || !!dto.dateOfBirth,
        },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Failed to publish profile viewed event for account ${account.id}: ${err.message}`,
        err.stack,
      );
    }
  }
}
