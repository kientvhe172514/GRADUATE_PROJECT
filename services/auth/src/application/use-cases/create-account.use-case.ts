import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CreateAccountDto } from '../dto/create-account.dto';
import { Account } from '../../domain/entities/account.entity';
import { AccountFactory } from '../../domain/factories/account.factory';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, HASHING_SERVICE, EVENT_PUBLISHER } from '../tokens';
import { UserRegisteredEvent } from '../../domain/events/user-registered.event';
import { AccountCreatedEventDto } from '../dto/account-created.event.dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
  ) {}

  async execute(dto: CreateAccountDto): Promise<ApiResponseDto<{ id: number; email: string; temp_password: string }>> {
    const existing = await this.accountRepo.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException(ErrorCodes.ACCOUNT_ALREADY_EXISTS, 'Account already exists');
    }

    // Use custom password if provided, otherwise use temporary password "1"
    const tempPass = dto.password || '1';
    const isCustomPassword = !!dto.password;
    const tempPasswordHash = await this.hashing.hash(tempPass);

    // Determine role from suggested_role or default to EMPLOYEE
    let assignedRole = dto.suggested_role || 'EMPLOYEE';
    
    // Validate role exists in AccountRole enum
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_STAFF', 'HR', 'MANAGER', 'EMPLOYEE'];
    if (!validRoles.includes(assignedRole.toUpperCase())) {
      console.warn(`⚠️ Invalid role "${assignedRole}" from position, defaulting to EMPLOYEE`);
      assignedRole = 'EMPLOYEE';
    }

    console.log(`🔐 Creating account with role: ${assignedRole}, custom password: ${isCustomPassword}`);

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
      role: assignedRole as any, // Assign role from position's suggested_role
    });

    const savedAccount = await this.accountRepo.create(account);

    // Publish account_created event for employee service (backward compatibility)
    if (dto.employee_id) {
      const backEvent = new AccountCreatedEventDto();
      backEvent.account_id = savedAccount.id!;
      backEvent.employee_id = dto.employee_id;
      backEvent.temp_password = tempPass;
      console.log('Publishing account_created with data:', backEvent);
      this.publisher.publish('account_created', backEvent);
    }

    // Only publish notification event if using temporary password
    // (Custom password = manual creation, no need to send email)
    if (!isCustomPassword) {
      const userRegisteredEvent = {
        userId: savedAccount.id!,
        email: savedAccount.email,
        fullName: dto.full_name,
        tempPassword: tempPass,
        timestamp: new Date().toISOString(),
      };
      console.log('Publishing auth.user-registered with data:', userRegisteredEvent);
      this.publisher.publish('auth.user-registered', userRegisteredEvent);
    } else {
      console.log('⏭️  Skipping notification email (custom password provided)');
    }

    return ApiResponseDto.success(
      { id: savedAccount.id!, email: savedAccount.email, temp_password: tempPass }, 
      isCustomPassword ? 'Account created successfully' : 'Account created with temporary password', 
      201, 
      undefined, 
      'ACCOUNT_CREATED'
    );
  }
}