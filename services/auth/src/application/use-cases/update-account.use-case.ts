import { Injectable, Inject } from '@nestjs/common';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, EVENT_PUBLISHER } from '../tokens';
import { AccountUpdatedEventDto } from '../dto/account-updated.event.dto';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { UpdateAccountResponseDto } from '../dto/update-account-response.dto';

export interface UpdateAccountDto {
  email?: string;
  role?: string;
  status?: string;
  employee_id?: number;
  employee_code?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  position_id?: number;
  position_name?: string;
  external_ids?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepository: AccountRepositoryPort,
    @Inject(EVENT_PUBLISHER)
    private eventPublisher: EventPublisherPort,
  ) {}

  async execute(id: number, dto: UpdateAccountDto): Promise<ApiResponseDto<UpdateAccountResponseDto>> {
    const existingAccount = await this.accountRepository.findById(id);
    if (!existingAccount) {
      throw new BusinessException(ErrorCodes.ACCOUNT_NOT_FOUND);
    }

    // Check for duplicate email if email is being updated
    if (dto.email && dto.email !== existingAccount.email) {
      const emailExists = await this.accountRepository.findByEmail(dto.email);
      if (emailExists) {
        throw new BusinessException(ErrorCodes.ACCOUNT_ALREADY_EXISTS, 'Account email already exists', 409);
      }
    }

    // Update account data
    Object.assign(existingAccount, dto);
    existingAccount.updated_at = new Date();
    existingAccount.sync_version = (existingAccount.sync_version || 1) + 1;

    const updatedAccount = await this.accountRepository.update(existingAccount);

    // Publish event
    const eventDto = new AccountUpdatedEventDto(updatedAccount);
    this.eventPublisher.publish('account_updated', eventDto);

    const resp: UpdateAccountResponseDto = {
      id: updatedAccount.id!,
      email: updatedAccount.email,
      full_name: updatedAccount.full_name,
      role: updatedAccount.role,
      status: updatedAccount.status,
      department_id: updatedAccount.department_id,
      department_name: updatedAccount.department_name,
      position_id: updatedAccount.position_id,
      position_name: updatedAccount.position_name,
      sync_version: updatedAccount.sync_version,
      updated_at: updatedAccount.updated_at!,
    };
    return ApiResponseDto.success(resp, 'Account updated');
  }
}
