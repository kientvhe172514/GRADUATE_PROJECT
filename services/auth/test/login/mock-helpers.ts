import { AccountRepositoryPort } from '../../src/application/ports/account.repository.port';
import { RefreshTokensRepositoryPort } from '../../src/application/ports/refresh-tokens.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../../src/application/ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../../src/application/ports/hashing.service.port';
import { JwtServicePort } from '../../src/application/ports/jwt.service.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { AuditLogsRepositoryPort } from '../../src/application/ports/audit-logs.repository.port';
import { Account } from '../../src/domain/entities/account.entity';
import { TemporaryPasswords } from '../../src/domain/entities/temporary-passwords.entity';
import { AccountRole, AccountType } from '../../src/domain/value-objects/account-type.vo';
import { AccountStatus } from '../../src/domain/value-objects/account-status.vo';
import { CreateDeviceSessionUseCase } from '../../src/application/use-cases/device/create-device-session.use-case';
import { LogDeviceActivityUseCase } from '../../src/application/use-cases/device/log-device-activity.use-case';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const EXPECTED_SUCCESS_RESPONSE = {
    status: 'SUCCESS',
    statusCode: 200,
};

export const MOCK_IP_ADDRESS = '192.168.1.100';
export const MOCK_USER_AGENT = 'Mozilla/5.0 (iPhone)';
export const MOCK_DEVICE_ID = 'device_123';
export const MOCK_FCM_TOKEN = 'fcm_token_xyz';
export const MOCK_LOCATION = { latitude: 10.762622, longitude: 106.660172 };

/**
 * Create a common account with optional overrides
 * @param overrides - Fields to override in the account
 * @returns Account object with common data merged with overrides
 */
export const createMockAccount = (overrides = {}): Account => ({
    id: 1,
    email: 'active@company.com',
    password_hash: '$2b$10$hashedpassword',
    account_type: AccountType.EMPLOYEE,
    role_id: 1,
    role: AccountRole.EMPLOYEE,
    employee_id: 100,
    employee_code: 'EMP001',
    full_name: 'John Doe',
    department_id: 10,
    department_name: 'Engineering',
    position_id: 5,
    position_name: 'Software Engineer',
    status: AccountStatus.ACTIVE,
    failed_login_attempts: 0,
    locked_until: undefined,
    last_login_at: undefined,
    last_login_ip: undefined,
    created_at: new Date('2025-01-01T10:00:00Z'),
    sync_version: 1,
    updated_at: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
});

/**
 * Create a mock temporary password entity
 * @param overrides - Fields to override
 * @returns TemporaryPasswords object
 */
export const createMockTemporaryPassword = (overrides = {}): Partial<TemporaryPasswords> => ({
    id: 1,
    account_id: 1,
    temp_password_hash: '$2b$10$temphashedpassword',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    must_change_password: true,
    used_at: undefined,
    created_at: new Date(),
    ...overrides,
});

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_ACCOUNT_ACTIVE = "- Account with email 'active@company.com' EXISTS with status ACTIVE";
export const PRECONDITION_ACCOUNT_INACTIVE = "- Account with email 'inactive@company.com' EXISTS with status INACTIVE";
export const PRECONDITION_ACCOUNT_LOCKED = "- Account with email 'locked@company.com' EXISTS with status LOCKED";
export const PRECONDITION_ACCOUNT_SUSPENDED = "- Account with email 'suspended@company.com' EXISTS with status SUSPENDED";
export const PRECONDITION_ACCOUNT_NOT_FOUND = "- Account with email 'nonexistent@company.com' does NOT exist";
export const PRECONDITION_DEVICE_SESSION_SUCCESS = '- Device session creation succeeds';
export const PRECONDITION_TEMP_PASSWORD_ACTIVE = '- Account has active temporary password';
export const PRECONDITION_TEMP_PASSWORD_EXPIRED = '- Account has expired temporary password';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_LOGIN = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_ACTIVE}
     * ${PRECONDITION_DEVICE_SESSION_SUCCESS}`;

export const PRECONDITIONS_LOGIN_NOT_FOUND = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_NOT_FOUND}`;

export const PRECONDITIONS_LOGIN_INACTIVE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_INACTIVE}`;

export const PRECONDITIONS_LOGIN_WITH_TEMP_PASSWORD = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_ACCOUNT_ACTIVE}
     * ${PRECONDITION_TEMP_PASSWORD_ACTIVE}
     * ${PRECONDITION_DEVICE_SESSION_SUCCESS}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockAccountRepository: jest.Mocked<AccountRepositoryPort>;
    mockRefreshTokensRepository: jest.Mocked<RefreshTokensRepositoryPort>;
    mockTempPasswordsRepository: jest.Mocked<TemporaryPasswordsRepositoryPort>;
    mockHashingService: jest.Mocked<HashingServicePort>;
    mockJwtService: jest.Mocked<JwtServicePort>;
    mockEventPublisher: jest.Mocked<EventPublisherPort>;
    mockAuditLogsRepository: jest.Mocked<AuditLogsRepositoryPort>;
    mockCreateDeviceSessionUseCase: jest.Mocked<CreateDeviceSessionUseCase>;
    mockLogDeviceActivityUseCase: jest.Mocked<LogDeviceActivityUseCase>;
}

/**
 * Setup success mocks for login operation
 * @param mocks - All mocked dependencies
 * @param account - Account to be returned by findByEmail
 * @param tempPassword - Optional temporary password entity
 * @param passwordValid - Whether password comparison should succeed
 */
export const setupLoginMocks = (
    mocks: MockRepositories,
    account: Account | null,
    tempPassword: Partial<TemporaryPasswords> | null = null,
    passwordValid: boolean = true
) => {
    jest.clearAllMocks();

    mocks.mockAccountRepository.findByEmail.mockResolvedValue(account);
    mocks.mockAccountRepository.resetFailedLoginAttempts.mockResolvedValue(undefined);
    mocks.mockAccountRepository.updateLastLogin.mockResolvedValue(undefined);
    mocks.mockAccountRepository.incrementFailedLoginAttempts.mockResolvedValue(undefined);
    mocks.mockAccountRepository.lockAccount.mockResolvedValue(undefined);

    mocks.mockTempPasswordsRepository.findActiveByAccountId.mockResolvedValue(tempPassword as any);

    mocks.mockHashingService.compare.mockResolvedValue(passwordValid);

    mocks.mockJwtService.generateAccessToken.mockResolvedValue('jwt_access_token');
    mocks.mockJwtService.generateRefreshToken.mockReturnValue('jwt_refresh_token');

    mocks.mockRefreshTokensRepository.create.mockResolvedValue({
        id: 1,
        account_id: account?.id || 1,
        token_hash: 'hashed_refresh_token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
    } as any);

    mocks.mockEventPublisher.publish.mockImplementation(() => { });

    mocks.mockAuditLogsRepository.create.mockResolvedValue({
        id: 1,
        account_id: account?.id || null,
        action: 'LOGIN_SUCCESS',
        success: true,
        created_at: new Date(),
    } as any);

    mocks.mockCreateDeviceSessionUseCase.execute.mockResolvedValue({
        id: 1,
        account_id: account?.id || 1,
        device_id: MOCK_DEVICE_ID,
        platform: 'ANDROID',
        is_active: true,
        created_at: new Date(),
    } as any);

    mocks.mockLogDeviceActivityUseCase.execute.mockResolvedValue({
        id: 1,
        device_session_id: 1,
        account_id: account?.id || 1,
        activity_type: 'LOGIN',
        status: 'SUCCESS',
        created_at: new Date(),
    } as any);
};

/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 * @param expectedMessage - Expected message (default: 'Login successful')
 */
export const expectSuccessResponse = (result: any, expectedMessage: string = 'Login successful') => {
    expect(result.status).toBe(EXPECTED_SUCCESS_RESPONSE.status);
    expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
    expect(result.message).toBe(expectedMessage);
    expect(result.data).toBeDefined();
    expect(result.data!.access_token).toBeDefined();
    expect(result.data!.refresh_token).toBeDefined();
    expect(result.data!.user).toBeDefined();
};

/**
 * Expect user info in response
 * @param userInfo - User info object to validate
 * @param expectedAccount - Expected account data
 */
export const expectUserInfo = (userInfo: any, expectedAccount: Account) => {
    expect(userInfo.id).toBe(expectedAccount.id);
    expect(userInfo.email).toBe(expectedAccount.email);
    expect(userInfo.full_name).toBe(expectedAccount.full_name);
    expect(userInfo.role).toBe(expectedAccount.role);
    expect(userInfo.employee_id).toBe(expectedAccount.employee_id);
};

/**
 * Expect audit log to be created
 * @param mockAuditLogsRepository - Mocked audit logs repository
 * @param action - Expected action (e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILED')
 * @param success - Expected success status
 */
export const expectAuditLog = (
    mockAuditLogsRepository: jest.Mocked<AuditLogsRepositoryPort>,
    action: string,
    success: boolean
) => {
    expect(mockAuditLogsRepository.create).toHaveBeenCalled();
    const auditLogCall = mockAuditLogsRepository.create.mock.calls[0][0];
    expect(auditLogCall.action).toBe(action);
    expect(auditLogCall.success).toBe(success);
};

/**
 * Expect device session to be created
 * @param mockCreateDeviceSessionUseCase - Mocked device session use case
 * @param accountId - Expected account ID
 */
export const expectDeviceSession = (
    mockCreateDeviceSessionUseCase: jest.Mocked<CreateDeviceSessionUseCase>,
    accountId: number
) => {
    expect(mockCreateDeviceSessionUseCase.execute).toHaveBeenCalled();
    const deviceSessionCall = mockCreateDeviceSessionUseCase.execute.mock.calls[0][0];
    expect(deviceSessionCall.account_id).toBe(accountId);
};

/**
 * Expect device activity to be logged
 * @param mockLogDeviceActivityUseCase - Mocked device activity use case
 * @param activityType - Expected activity type
 * @param status - Expected status
 */
export const expectDeviceActivity = (
    mockLogDeviceActivityUseCase: jest.Mocked<LogDeviceActivityUseCase>,
    activityType: string,
    status: string
) => {
    expect(mockLogDeviceActivityUseCase.execute).toHaveBeenCalled();
    const activityCall = mockLogDeviceActivityUseCase.execute.mock.calls[0][0];
    expect(activityCall.activity_type).toBe(activityType);
    expect(activityCall.status).toBe(status);
};
