import { AccountRepositoryPort } from '../../src/application/ports/account.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { Account } from '../../src/domain/entities/account.entity';
import { AccountRole, AccountType } from '../../src/domain/value-objects/account-type.vo';
import { AccountStatus } from '../../src/domain/value-objects/account-status.vo';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const EXPECTED_SUCCESS_RESPONSE = {
  status: 'SUCCESS',
  statusCode: 200,
  message: 'Account updated',
};

/**
 * Create a common updated account with optional overrides
 * @param overrides - Fields to override in the updated account
 * @returns Account object with common data merged with overrides
 */
export const createUpdatedAccount = (overrides = {}): Account => ({
  id: 1,
  email: 'john.doe@company.com',
  password_hash: 'hashed_password',
  account_type: AccountType.EMPLOYEE,
  role: AccountRole.EMPLOYEE,
  role_id: 4, // EMPLOYEE role ID
  employee_id: 100,
  employee_code: 'EMP001',
  full_name: 'John Doe',
  department_id: 10,
  department_name: 'Engineering',
  position_id: 5,
  position_name: 'Software Engineer',
  status: AccountStatus.ACTIVE,
  failed_login_attempts: 0,
  created_at: new Date('2025-01-01T10:00:00Z'),
  sync_version: 1,
  updated_at: new Date('2025-11-09T10:00:00Z'),
  ...overrides,
});

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_ACCOUNT_EXISTS = "- account_id 1 EXISTS";
export const PRECONDITION_ACCOUNT_NOT_EXISTS = "- account_id 999 does NOT exist";
export const PRECONDITION_EMAIL_NOT_EXISTS = "- email 'new@company.com' does NOT exist";
export const PRECONDITION_EMAIL_EXISTS = "- email 'existing@company.com' ALREADY EXISTS";
export const PRECONDITION_EVENT_SERVICE_AVAILABLE = '- Event publishing service available';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_UPDATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_EXISTS}`;

export const PRECONDITIONS_ACCOUNT_NOT_FOUND = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_NOT_EXISTS}`;

export const PRECONDITIONS_EMAIL_CONFLICT = `${PRECONDITIONS_BASIC_UPDATE}
     * ${PRECONDITION_EMAIL_EXISTS}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

/**
 * Setup success mocks for repository operations
 * @param mockAccountRepository - Mocked account repository
 * @param mockEventPublisher - Mocked event publisher
 * @param existingAccount - Existing account to be returned by findById
 * @param updatedAccount - Updated account to be returned by update
 * @param emailCheckResult - Result for findByEmail (null means email is available)
 */
export const setupMocks = (
  mockAccountRepository: jest.Mocked<AccountRepositoryPort>,
  mockEventPublisher: jest.Mocked<EventPublisherPort>,
  existingAccount: Account,
  updatedAccount: Account,
  emailCheckResult: Account | null = null
) => {
  // Clear previous mocks
  jest.clearAllMocks();

  // Setup account repository mocks
  mockAccountRepository.findById.mockResolvedValue(existingAccount);
  mockAccountRepository.findByEmail.mockResolvedValue(emailCheckResult);
  // Return the account that was passed to update (which has the incremented sync_version)
  // and simulate the database join that populates the role field based on role_id
  mockAccountRepository.update.mockImplementation(async (account: Account) => {
    // Map role_id to role code (simulating database join)
    const roleMap: Record<number, string> = {
      1: AccountRole.ADMIN,
      2: AccountRole.HR_MANAGER,
      3: AccountRole.DEPARTMENT_MANAGER,
      4: AccountRole.EMPLOYEE,
    };

    // If role_id was updated, set the corresponding role code
    if (account.role_id && roleMap[account.role_id]) {
      account.role = roleMap[account.role_id];
    }

    return account;
  });

  // Setup event publisher mock
  mockEventPublisher.publish.mockImplementation(() => { });
};

/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 */
export const expectSuccessResponse = (result: any) => {
  expect(result.status).toBe(EXPECTED_SUCCESS_RESPONSE.status);
  expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
  expect(result.message).toBe(EXPECTED_SUCCESS_RESPONSE.message);
};
