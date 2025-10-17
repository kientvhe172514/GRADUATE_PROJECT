import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { Account } from '../../domain/entities/account.entity';
import { AccountFactory } from '../../domain/factories/account.factory';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { TemporaryPasswords } from '../../domain/entities/temporary-passwords.entity';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, HASHING_SERVICE, EVENT_PUBLISHER, TEMPORARY_PASSWORDS_REPOSITORY } from '../tokens';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { AccountCreatedEventDto } from '../dto/account-created.event.dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private tempPasswordsRepo: TemporaryPasswordsRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateAccountDto): Promise<ApiResponseDto<{ id: number; email: string }>> {
    const existing = await this.accountRepo.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException(ErrorCodes.ACCOUNT_ALREADY_EXISTS);
    }

    // Generate temporary password
    const tempPass = randomBytes(16).toString('hex');
    const tempPasswordHash = await this.hashing.hash(tempPass);

    // Create account using Factory Pattern
    const account = AccountFactory.createEmployeeAccount({
      email: dto.email,
      password_hash: tempPasswordHash,
      employee_id: dto.employee_id,
      employee_code: dto.employee_code,
      full_name: dto.full_name,
      department_id: dto.department_id,
      department_name: dto.department_name,
      position_id: dto.position_id,
      position_name: dto.position_name,
    });

    const savedAccount = await this.accountRepo.create(account);

    // Create temporary password record
    const tempPassword = new TemporaryPasswords();
    tempPassword.account_id = savedAccount.id!;
    tempPassword.temp_password_hash = tempPasswordHash;
    tempPassword.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    tempPassword.must_change_password = true;

    await this.tempPasswordsRepo.create(tempPassword);

    const backEvent = new AccountCreatedEventDto();
    backEvent.account_id = savedAccount.id!;
    backEvent.employee_id = dto.employee_id;
    console.log('Publishing account_created with data:', backEvent);
    this.publisher.publish('account_created', backEvent);

    // First-time password setup via email/sms: publish reset token event
    this.publisher.publish('auth.password-reset-requested', {
      account_id: savedAccount.id,
      email: savedAccount.email,
      full_name: savedAccount.full_name,
      reset_token: tempPass,
      expires_at: tempPassword.expires_at,
      reason: 'first_time_setup',
    });

    return ApiResponseDto.success({ id: savedAccount.id!, email: savedAccount.email }, 'Account created, setup link sent', 201, undefined, 'ACCOUNT_CREATED');
  }
}