import { Test, TestingModule } from '@nestjs/testing';
import { UpdateAccountUseCase, UpdateAccountDto } from '../../src/application/use-cases/update-account.use-case';
import { AccountRepositoryPort } from '../../src/application/ports/account.repository.port';
import { RoleRepositoryPort } from '../../src/application/ports/role.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, ROLE_REPOSITORY, EVENT_PUBLISHER } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Account } from '../../src/domain/entities/account.entity';
import { AccountRole } from '../../src/domain/value-objects/account-type.vo';
import { AccountStatus } from '../../src/domain/value-objects/account-status.vo';
import {
  EXPECTED_SUCCESS_RESPONSE,
  createUpdatedAccount,
  setupMocks,
  expectSuccessResponse,
  PRECONDITIONS_BASIC_UPDATE,
  PRECONDITIONS_ACCOUNT_NOT_FOUND,
  PRECONDITIONS_EMAIL_CONFLICT,
} from './mock-helpers';

describe('UpdateAccountUseCase', () => {
  let useCase: UpdateAccountUseCase;
  let mockAccountRepository: jest.Mocked<AccountRepositoryPort>;
  let mockRoleRepository: jest.Mocked<RoleRepositoryPort>;
  let mockEventPublisher: jest.Mocked<EventPublisherPort>;

  beforeEach(async () => {
    // Create mock implementations
    mockAccountRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
      incrementFailedLoginAttempts: jest.fn(),
      resetFailedLoginAttempts: jest.fn(),
      lockAccount: jest.fn(),
      unlockAccount: jest.fn(),
      updatePassword: jest.fn(),
      setTemporaryPasswordFlag: jest.fn(),
      update: jest.fn(),
      findByEmployeeId: jest.fn(),
      updateStatus: jest.fn(),
      findWithPagination: jest.fn(),
    };

    mockRoleRepository = {
      getPermissionsByRoleCode: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdWithPermissions: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignPermissions: jest.fn(),
      removePermission: jest.fn(),
      getRolePermissions: jest.fn(),
    };

    // Default mock behavior for role lookup
    mockRoleRepository.findByCode.mockImplementation(async (code: string) => ({
      id: code === 'ADMIN' ? 1 : code === 'HR_MANAGER' ? 2 : code === 'DEPARTMENT_MANAGER' ? 3 : 4,
      code: code,
      name: code.replace('_', ' '),
      status: 'ACTIVE',
    }));

    mockEventPublisher = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAccountUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
        {
          provide: ROLE_REPOSITORY,
          useValue: mockRoleRepository,
        },
        {
          provide: EVENT_PUBLISHER,
          useValue: mockEventPublisher,
        },
      ],
    }).compile();

    useCase = module.get<UpdateAccountUseCase>(UpdateAccountUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to setup mocks with repositories from the test context
  const setupTestMocks = (
    existingAccount: Account,
    updatedAccount: Account,
    emailCheckResult: Account | null = null
  ) => {
    // Create a fresh copy of existingAccount to avoid mutations across tests
    const freshExistingAccount = { ...existingAccount };
    setupMocks(
      mockAccountRepository,
      mockEventPublisher,
      freshExistingAccount,
      updatedAccount,
      emailCheckResult
    );
  };

  describe('execute', () => {
    /**
     * @id UTCID01
     * @description Update account with all fields
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.new@company.com", full_name:"John Updated Doe", role:"HR_MANAGER", status:"ACTIVE", department_id:20, department_name:"Sales", position_id:10, position_name:"Senior Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID01: Update account with all fields', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        email: 'john.new@company.com',
        role: AccountRole.HR_MANAGER,
        status: AccountStatus.ACTIVE,
        employee_id: 101,
        employee_code: 'EMP002',
        full_name: 'John Updated Doe',
        department_id: 20,
        department_name: 'Sales',
        position_id: 10,
        position_name: 'Senior Engineer',
        external_ids: { ldap_id: '12345' },
        metadata: { note: 'Updated user' },
      };

      const updatedAccount = createUpdatedAccount({
        email: updateDto.email,
        role: updateDto.role,
        status: updateDto.status,
        employee_id: updateDto.employee_id,
        employee_code: updateDto.employee_code,
        full_name: updateDto.full_name,
        department_id: updateDto.department_id,
        department_name: updateDto.department_name,
        position_id: updateDto.position_id,
        position_name: updateDto.position_name,
        external_ids: updateDto.external_ids,
        metadata: updateDto.metadata,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount, null);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data).toEqual({
        id: updatedAccount.id,
        email: updatedAccount.email,
        full_name: updatedAccount.full_name,
        role: updatedAccount.role,
        status: updatedAccount.status,
        department_id: updatedAccount.department_id,
        department_name: updatedAccount.department_name,
        position_id: updatedAccount.position_id,
        position_name: updatedAccount.position_name,
        sync_version: 2,
        updated_at: expect.any(Date),
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(1);
      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith('john.new@company.com');
      expect(mockAccountRepository.update).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    /**
     * @id UTCID02
     * @description Update account with partial fields
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Updated Only Name", role:"EMPLOYEE", status:"ACTIVE", department_id:30, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID02: Update account with partial fields', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        full_name: 'John Updated Only Name',
        department_id: 30,
      };

      const updatedAccount = createUpdatedAccount({
        full_name: updateDto.full_name,
        department_id: updateDto.department_id,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.full_name).toBe('John Updated Only Name');
      expect(result.data?.department_id).toBe(30);
      expect(result.data?.sync_version).toBe(2);
      expect(mockAccountRepository.findByEmail).not.toHaveBeenCalled();
    });

    /**
     * @id UTCID03
     * @description Update account with different email
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.different@company.com", full_name:"John Different Email", role:"EMPLOYEE", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID03: Update account with different email', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        email: 'john.different@company.com',
        full_name: 'John Different Email',
      };

      const updatedAccount = createUpdatedAccount({
        email: updateDto.email,
        full_name: updateDto.full_name,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount, null);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.email).toBe('john.different@company.com');
      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith('john.different@company.com');
    });

    /**
     * @id UTCID04
     * @description Update only status field
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"EMPLOYEE", status:"INACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID04: Update only status field', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        status: AccountStatus.INACTIVE,
      };

      const updatedAccount = createUpdatedAccount({
        status: AccountStatus.INACTIVE,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.status).toBe(AccountStatus.INACTIVE);
    });

    /**
     * @id UTCID05
     * @description Update only role field
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"ADMIN", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID05: Update only role field', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        role: AccountRole.ADMIN,
      };

      const updatedAccount = createUpdatedAccount({
        role: AccountRole.ADMIN,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.role).toBe(AccountRole.ADMIN);
    });

    /**
     * @id UTCID06
     * @description Update external_ids and metadata
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"EMPLOYEE", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z'), external_ids:{ldap_id:'99999', ad_id:'AD123'}, metadata:{notes:'Important user', tags:['vip','manager']}}}
     */
    it('UTCID06: Update external_ids and metadata', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        external_ids: { ldap_id: '99999', ad_id: 'AD123' },
        metadata: { notes: 'Important user', tags: ['vip', 'manager'] },
      };

      const updatedAccount = createUpdatedAccount({
        external_ids: updateDto.external_ids,
        metadata: updateDto.metadata,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      expect(accountToUpdate.external_ids).toEqual({ ldap_id: '99999', ad_id: 'AD123' });
      expect(accountToUpdate.metadata).toEqual({ notes: 'Important user', tags: ['vip', 'manager'] });
    });

    /**
     * @id UTCID07
     * @description Throw error when account not found
     * @type A
     * @output "Account not found"
     */
    it('UTCID07: Throw error when account not found', async () => {
      // Arrange
      jest.clearAllMocks();

      const updateDto: UpdateAccountDto = {
        full_name: 'Updated Name',
      };

      mockAccountRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(useCase.execute(999, updateDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(999, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.ACCOUNT_NOT_FOUND);
        expect((error as BusinessException).message).toBe('Account not found');
      }

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(999);
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    /**
     * @id UTCID08
     * @description Throw error when email already exists
     * @type A
     * @output "Account email already exists"
     */
    it('UTCID08: Throw error when email already exists', async () => {
      // Arrange
      jest.clearAllMocks();

      const updateDto: UpdateAccountDto = {
        email: 'existing@company.com',
        full_name: 'Updated Name',
      };

      const anotherAccount: Account = {
        ...createUpdatedAccount(),
        id: 2,
        email: 'existing@company.com',
      };

      mockAccountRepository.findById.mockResolvedValue(createUpdatedAccount());
      mockAccountRepository.findByEmail.mockResolvedValue(anotherAccount);

      // Act & Assert
      await expect(useCase.execute(1, updateDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(1, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.ACCOUNT_ALREADY_EXISTS);
        expect((error as BusinessException).message).toBe('Account email already exists');
        expect((error as BusinessException).statusCode).toBe(409);
      }

      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith('existing@company.com');
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    /**
     * @id UTCID09
     * @description Update employee_code and employee_id
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"EMPLOYEE", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", employee_id:999, employee_code:"EMP999", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID09: Update employee_code and employee_id', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        employee_id: 999,
        employee_code: 'EMP999',
      };

      const updatedAccount = createUpdatedAccount({
        employee_id: updateDto.employee_id,
        employee_code: updateDto.employee_code,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      expect(accountToUpdate.employee_id).toBe(999);
      expect(accountToUpdate.employee_code).toBe('EMP999');
    });

    /**
     * @id UTCID10
     * @description Verify sync_version incremented
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"Test Sync Version", role:"EMPLOYEE", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID10: Verify sync_version incremented', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        full_name: 'Test Sync Version',
      };

      const updatedAccount = createUpdatedAccount({
        full_name: updateDto.full_name,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      // sync_version should be incremented from initial value (1) to 2
      expect(accountToUpdate.sync_version).toBe(2);
      expect(result.data?.sync_version).toBe(2);
    });

    /**
     * @id UTCID11
     * @description Handle empty update dto
     * @type B
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"EMPLOYEE", status:"ACTIVE", department_id:10, department_name:"Engineering", position_id:5, position_name:"Software Engineer", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID11: Handle empty update dto', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {};

      const updatedAccount = createUpdatedAccount();

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(mockAccountRepository.update).toHaveBeenCalledTimes(1);
      expect(result.data?.sync_version).toBe(2);
    });

    /**
     * @id UTCID12
     * @description Update position and department names
     * @type N
     * @output {status:"SUCCESS", statusCode:200, message:"Account updated", data:{id:1, email:"john.doe@company.com", full_name:"John Doe", role:"EMPLOYEE", status:"ACTIVE", department_id:50, department_name:"Human Resources", position_id:20, position_name:"HR Manager", sync_version:2, updated_at:Date('2025-11-09T10:00:00Z')}}
     */
    it('UTCID12: Update position and department names', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        department_id: 50,
        department_name: 'Human Resources',
        position_id: 20,
        position_name: 'HR Manager',
      };

      const updatedAccount = createUpdatedAccount({
        department_id: updateDto.department_id,
        department_name: updateDto.department_name,
        position_id: updateDto.position_id,
        position_name: updateDto.position_name,
      });

      setupTestMocks(createUpdatedAccount(), updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.department_id).toBe(50);
      expect(result.data?.department_name).toBe('Human Resources');
      expect(result.data?.position_id).toBe(20);
      expect(result.data?.position_name).toBe('HR Manager');
    });

    /**
     * @id UTCID13
     * @description Throw error when invalid role code is provided
     * @type A
     * @output "Invalid role \"INVALID_ROLE\". Valid roles are: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE"
     */
    it('UTCID13: Throw error when invalid role code is provided', async () => {
      // Arrange
      jest.clearAllMocks();

      const updateDto: UpdateAccountDto = {
        role: 'INVALID_ROLE',
        full_name: 'Updated Name',
      };

      mockAccountRepository.findById.mockResolvedValue(createUpdatedAccount());

      // Act & Assert
      await expect(useCase.execute(1, updateDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(1, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.BAD_REQUEST);
        expect((error as BusinessException).message).toBe(
          'Invalid role "INVALID_ROLE". Valid roles are: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE'
        );
      }

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRoleRepository.findByCode).not.toHaveBeenCalled();
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    /**
     * @id UTCID14
     * @description Throw error when role not found in database
     * @type A
     * @output "Role \"ADMIN\" not found in database"
     */
    it('UTCID14: Throw error when role not found in database', async () => {
      // Arrange
      jest.clearAllMocks();

      const updateDto: UpdateAccountDto = {
        role: 'ADMIN',
        full_name: 'Updated Name',
      };

      mockAccountRepository.findById.mockResolvedValue(createUpdatedAccount());
      mockRoleRepository.findByCode.mockResolvedValue(null); // Role not found in database

      // Act & Assert
      await expect(useCase.execute(1, updateDto)).rejects.toThrow(BusinessException);

      try {
        await useCase.execute(1, updateDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BusinessException);
        expect((error as BusinessException).errorCode).toBe(ErrorCodes.ROLE_NOT_FOUND);
        expect((error as BusinessException).message).toBe('Role "ADMIN" not found in database');
        expect((error as BusinessException).statusCode).toBe(404);
      }

      expect(mockAccountRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRoleRepository.findByCode).toHaveBeenCalledWith('ADMIN');
      expect(mockAccountRepository.update).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });
  });
});
