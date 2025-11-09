import { Test, TestingModule } from '@nestjs/testing';
import { UpdateAccountUseCase, UpdateAccountDto } from '../../src/application/use-cases/update-account.use-case';
import { AccountRepositoryPort } from '../../src/application/ports/account.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, EVENT_PUBLISHER } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { Account } from '../../src/domain/entities/account.entity';
import { AccountRole } from '../../src/domain/value-objects/account-type.vo';
import { AccountStatus } from '../../src/domain/value-objects/account-status.vo';
import {
  COMMON_EXISTING_ACCOUNT,
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
     * TC_001: Update account with all fields
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with all fields | Output: EXPECTED_SUCCESS_RESPONSE + event published
     */
    it('TC_001: Update account with all fields', async () => {
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

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount, null);

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
        sync_version: updatedAccount.sync_version,
        updated_at: updatedAccount.updated_at,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(1);
      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith('john.new@company.com');
      expect(mockAccountRepository.update).toHaveBeenCalledTimes(1);
      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    });

    /**
     * TC_002: Update account with partial fields
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with only full_name and department_id | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_002: Update account with partial fields', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        full_name: 'John Updated Only Name',
        department_id: 30,
      };

      const updatedAccount = createUpdatedAccount({
        full_name: updateDto.full_name,
        department_id: updateDto.department_id,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

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
     * TC_003: Update account with different email
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with new email | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_003: Update account with different email', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        email: 'john.different@company.com',
        full_name: 'John Different Email',
      };

      const updatedAccount = createUpdatedAccount({
        email: updateDto.email,
        full_name: updateDto.full_name,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount, null);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.email).toBe('john.different@company.com');
      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith('john.different@company.com');
    });

    /**
     * TC_004: Update only status field
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with only status | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_004: Update only status field', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        status: AccountStatus.INACTIVE,
      };

      const updatedAccount = createUpdatedAccount({
        status: AccountStatus.INACTIVE,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.status).toBe(AccountStatus.INACTIVE);
    });

    /**
     * TC_005: Update only role field
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with only role | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_005: Update only role field', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        role: AccountRole.ADMIN,
      };

      const updatedAccount = createUpdatedAccount({
        role: AccountRole.ADMIN,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.role).toBe(AccountRole.ADMIN);
    });

    /**
     * TC_006: Update external_ids and metadata
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with external_ids and metadata | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_006: Update external_ids and metadata', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        external_ids: { ldap_id: '99999', ad_id: 'AD123' },
        metadata: { notes: 'Important user', tags: ['vip', 'manager'] },
      };

      const updatedAccount = createUpdatedAccount({
        external_ids: updateDto.external_ids,
        metadata: updateDto.metadata,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      expect(accountToUpdate.external_ids).toEqual({ ldap_id: '99999', ad_id: 'AD123' });
      expect(accountToUpdate.metadata).toEqual({ notes: 'Important user', tags: ['vip', 'manager'] });
    });

    /**
     * TC_007: Throw error when account not found
     * Preconditions: ${PRECONDITIONS_ACCOUNT_NOT_FOUND}
     * Input: updateDto for non-existent account | Output: BusinessException 'ACCOUNT_NOT_FOUND'
     */
    it('TC_007: Throw error when account not found', async () => {
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
     * TC_008: Throw error when email already exists
     * Preconditions: ${PRECONDITIONS_EMAIL_CONFLICT}
     * Input: updateDto with existing email | Output: BusinessException 'ACCOUNT_ALREADY_EXISTS'
     */
    it('TC_008: Throw error when email already exists', async () => {
      // Arrange
      jest.clearAllMocks();

      const updateDto: UpdateAccountDto = {
        email: 'existing@company.com',
        full_name: 'Updated Name',
      };

      const anotherAccount: Account = {
        ...COMMON_EXISTING_ACCOUNT,
        id: 2,
        email: 'existing@company.com',
      };

      mockAccountRepository.findById.mockResolvedValue(COMMON_EXISTING_ACCOUNT);
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
     * TC_009: Update employee_code and employee_id
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with employee fields | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_009: Update employee_code and employee_id', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        employee_id: 999,
        employee_code: 'EMP999',
      };

      const updatedAccount = createUpdatedAccount({
        employee_id: updateDto.employee_id,
        employee_code: updateDto.employee_code,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      expect(accountToUpdate.employee_id).toBe(999);
      expect(accountToUpdate.employee_code).toBe('EMP999');
    });

    /**
     * TC_010: Verify sync_version incremented
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto | Output: sync_version incremented from 1 to 2
     */
    it('TC_010: Verify sync_version incremented', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {
        full_name: 'Test Sync Version',
      };

      const updatedAccount = createUpdatedAccount({
        full_name: updateDto.full_name,
      });

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      const accountToUpdate = mockAccountRepository.update.mock.calls[0][0];
      // sync_version should be incremented from initial value (1) to 2
      expect(accountToUpdate.sync_version).toBe(2);
      expect(result.data?.sync_version).toBe(2);
    });

    /**
     * TC_011: Handle empty update dto
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: empty updateDto {} | Output: EXPECTED_SUCCESS_RESPONSE with sync_version incremented
     */
    it('TC_011: Handle empty update dto', async () => {
      // Arrange
      const updateDto: UpdateAccountDto = {};

      const updatedAccount = createUpdatedAccount();

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(mockAccountRepository.update).toHaveBeenCalledTimes(1);
      expect(result.data?.sync_version).toBe(2);
    });

    /**
     * TC_012: Update position and department names
     * Preconditions: ${PRECONDITIONS_BASIC_UPDATE}
     * Input: updateDto with position/department data | Output: EXPECTED_SUCCESS_RESPONSE
     */
    it('TC_012: Update position and department names', async () => {
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

      setupTestMocks(COMMON_EXISTING_ACCOUNT, updatedAccount);

      // Act
      const result = await useCase.execute(1, updateDto);

      // Assert
      expectSuccessResponse(result);
      expect(result.data?.department_id).toBe(50);
      expect(result.data?.department_name).toBe('Human Resources');
      expect(result.data?.position_id).toBe(20);
      expect(result.data?.position_name).toBe('HR Manager');
    });
  });
});
