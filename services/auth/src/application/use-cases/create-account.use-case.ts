import { Injectable, Inject } from '@nestjs/common';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreateAccountResponseDto } from '../dto/create-account-response.dto';
import { Account } from '../../domain/entities/account.entity';
import { AccountType } from '../../domain/value-objects/account-type.vo';
import { AccountStatus } from '../../domain/value-objects/account-status.vo';
import { ApiResponseDto, BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { RoleRepositoryPort } from '../ports/role.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import {
  ACCOUNT_REPOSITORY,
  ROLE_REPOSITORY,
  HASHING_SERVICE,
  EVENT_PUBLISHER,
  TEMPORARY_PASSWORDS_REPOSITORY,
} from '../tokens';
import { AccountCreatedEventDto } from '../dto/account-created.event.dto';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private accountRepo: AccountRepositoryPort,
    @Inject(ROLE_REPOSITORY)
    private roleRepo: RoleRepositoryPort,
    @Inject(HASHING_SERVICE)
    private hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private publisher: EventPublisherPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private tempPasswordsRepo: TemporaryPasswordsRepositoryPort,
  ) {}

  async execute(dto: CreateAccountDto): Promise<ApiResponseDto<CreateAccountResponseDto>> {
    const existing = await this.accountRepo.findByEmail(dto.email);
    if (existing) {
      throw new BusinessException(ErrorCodes.ACCOUNT_ALREADY_EXISTS, 'Account already exists');
    }

    // Use custom password if provided, otherwise use temporary password "1"
    const tempPass = dto.password || '1';
    const isCustomPassword = !!dto.password;
    const tempPasswordHash = await this.hashing.hash(tempPass);
    
    // Determine role from suggested_role or default to EMPLOYEE
    // Only 4 roles are allowed: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
    let roleCode = dto.suggested_role?.toUpperCase() || 'EMPLOYEE';
    const validRoles = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'];
    
    if (!validRoles.includes(roleCode)) {
      console.warn(`⚠️ Invalid role "${roleCode}", defaulting to EMPLOYEE`);
      roleCode = 'EMPLOYEE';
    }

    // Lookup role_id from roles table using role code
    let role = await this.roleRepo.findByCode(roleCode);
    if (!role) {
      console.error(`❌ Role "${roleCode}" not found in roles table, defaulting to EMPLOYEE`);
      const employeeRole = await this.roleRepo.findByCode('EMPLOYEE');
      if (!employeeRole) {
        throw new BusinessException(
          ErrorCodes.ROLE_NOT_FOUND,
          'EMPLOYEE role not found in database. Please ensure roles are seeded.',
          500,
        );
      }
      role = employeeRole;
      roleCode = 'EMPLOYEE';
    }

    console.log(`🔐 Creating account with role_id: ${role.id} (${roleCode}), custom password: ${isCustomPassword}`);

    // Create account - role_id is required, role field will be populated from join
    const account = new Account();
    account.email = dto.email;
    account.password_hash = tempPasswordHash;
    account.role_id = role.id; // Required: Foreign key to roles table
    account.employee_id = dto.employee_id;
    account.employee_code = dto.employee_code;
    account.full_name = dto.full_name;
    account.department_id = dto.department_id;
    account.department_name = dto.department_name;
    account.position_id = dto.position_id;
    account.position_name = dto.position_name;
    account.account_type = AccountType.EMPLOYEE;
    account.status = AccountStatus.ACTIVE;
    account.sync_version = 1;
    account.failed_login_attempts = 0;
    account.created_at = new Date();
    account.updated_at = new Date();

    const savedAccount = await this.accountRepo.create(account);

    // Create temporary password record if using default password
    if (!isCustomPassword) {
      const tempPasswordEntity = {
        account_id: savedAccount.id!,
        temp_password_hash: tempPasswordHash,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        must_change_password: true,
        created_at: new Date(),
      };
      await this.tempPasswordsRepo.create(tempPasswordEntity as any);
      console.log('✅ Created temporary password record for account:', savedAccount.id);
    }

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

    // Build response DTO
    const response: CreateAccountResponseDto = {
      id: savedAccount.id!,
      email: savedAccount.email,
      temp_password: isCustomPassword ? undefined : tempPass,
      has_custom_password: isCustomPassword,
    };

    return ApiResponseDto.success(
      response, 
      isCustomPassword ? 'Account created successfully' : 'Account created with temporary password', 
      201, 
      undefined, 
      'ACCOUNT_CREATED'
    );
  }
}