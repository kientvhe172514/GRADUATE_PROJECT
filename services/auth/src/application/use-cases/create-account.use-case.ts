import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { Account } from '../../domain/entities/account.entity';
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

  async execute(dto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountRepo.findByEmail(dto.email);
    if (existing) {
      throw new Error('Account already exists');
    }

    // Generate temporary password
    const tempPass = randomBytes(16).toString('hex');
    const tempPasswordHash = await this.hashing.hash(tempPass);

    // Create account with temporary password
    const account = new Account();
    account.email = dto.email;
    account.password_hash = tempPasswordHash; // This will be the temporary password initially
    account.employee_id = dto.employee_id;
    account.employee_code = dto.employee_code;
    account.full_name = dto.full_name;
    account.department_id = dto.department_id;
    account.department_name = dto.department_name;
    account.position_id = dto.position_id;
    account.position_name = dto.position_name;

    const savedAccount = await this.accountRepo.create(account);

    // Create temporary password record
    const tempPassword = new TemporaryPasswords();
    tempPassword.account_id = savedAccount.id!;
    tempPassword.temp_password_hash = tempPasswordHash;
    tempPassword.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    tempPassword.must_change_password = true;

    await this.tempPasswordsRepo.create(tempPassword);

    // Publish events
    this.publisher.publish('user_registered', new UserRegisteredEvent(savedAccount));

    const backEvent = new AccountCreatedEventDto();
    backEvent.account_id = savedAccount.id!;
    backEvent.employee_id = dto.employee_id;
    backEvent.temp_password = tempPass;
    this.publisher.publish('account_created', backEvent);

    return savedAccount;
  }
}