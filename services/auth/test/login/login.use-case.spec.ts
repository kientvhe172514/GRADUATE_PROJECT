import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LoginUseCase } from '../../src/application/use-cases/login.use-case';
import { LoginRequestDto } from '../../src/presentation/dto/login-request.dto';
import { AccountRepositoryPort } from '../../src/application/ports/account.repository.port';
import { RefreshTokensRepositoryPort } from '../../src/application/ports/refresh-tokens.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../../src/application/ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../../src/application/ports/hashing.service.port';
import { JwtServicePort } from '../../src/application/ports/jwt.service.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { AuditLogsRepositoryPort } from '../../src/application/ports/audit-logs.repository.port';
import {
    ACCOUNT_REPOSITORY,
    REFRESH_TOKENS_REPOSITORY,
    TEMPORARY_PASSWORDS_REPOSITORY,
    HASHING_SERVICE,
    JWT_SERVICE,
    EVENT_PUBLISHER,
    AUDIT_LOGS_REPOSITORY,
} from '../../src/application/tokens';
import { CreateDeviceSessionUseCase } from '../../src/application/use-cases/device/create-device-session.use-case';
import { LogDeviceActivityUseCase } from '../../src/application/use-cases/device/log-device-activity.use-case';
import { AccountStatus } from '../../src/domain/value-objects/account-status.vo';
import { AccountRole } from '../../src/domain/value-objects/account-type.vo';
import { DevicePlatform } from '../../src/domain/entities/device-session.entity';
import { ActivityType, ActivityStatus } from '../../src/domain/entities/device-activity-log.entity';
import {
    createMockAccount,
    createMockTemporaryPassword,
    setupLoginMocks,
    expectSuccessResponse,
    expectUserInfo,
    expectAuditLog,
    expectDeviceSession,
    expectDeviceActivity,
    MockRepositories,
    MOCK_IP_ADDRESS,
    MOCK_USER_AGENT,
    MOCK_DEVICE_ID,
    MOCK_FCM_TOKEN,
    MOCK_LOCATION,
    PRECONDITIONS_BASIC_LOGIN,
    PRECONDITIONS_LOGIN_NOT_FOUND,
    PRECONDITIONS_LOGIN_INACTIVE,
    PRECONDITIONS_LOGIN_WITH_TEMP_PASSWORD,
} from './mock-helpers';

describe('LoginUseCase', () => {
    let useCase: LoginUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockAccountRepository = {
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

        const mockRefreshTokensRepository = {
            create: jest.fn(),
            findByTokenHash: jest.fn(),
            findByAccountId: jest.fn(),
            revokeByTokenHash: jest.fn(),
            revokeAllByAccountId: jest.fn(),
            deleteExpired: jest.fn(),
        };

        const mockTempPasswordsRepository = {
            create: jest.fn(),
            findActiveByAccountId: jest.fn(),
            markAsUsed: jest.fn(),
            deleteExpired: jest.fn(),
        };

        const mockHashingService = {
            hash: jest.fn(),
            compare: jest.fn(),
        };

        const mockJwtService = {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
            verifyAccessToken: jest.fn(),
            verifyRefreshToken: jest.fn(),
        };

        const mockEventPublisher = {
            publish: jest.fn(),
        };

        const mockAuditLogsRepository = {
            create: jest.fn(),
            findByAccountId: jest.fn(),
            findWithPagination: jest.fn(),
        };

        const mockCreateDeviceSessionUseCase = {
            execute: jest.fn(),
        };

        const mockLogDeviceActivityUseCase = {
            execute: jest.fn(),
        };

        mocks = {
            mockAccountRepository: mockAccountRepository as any,
            mockRefreshTokensRepository: mockRefreshTokensRepository as any,
            mockTempPasswordsRepository: mockTempPasswordsRepository as any,
            mockHashingService: mockHashingService as any,
            mockJwtService: mockJwtService as any,
            mockEventPublisher: mockEventPublisher as any,
            mockAuditLogsRepository: mockAuditLogsRepository as any,
            mockCreateDeviceSessionUseCase: mockCreateDeviceSessionUseCase as any,
            mockLogDeviceActivityUseCase: mockLogDeviceActivityUseCase as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoginUseCase,
                {
                    provide: ACCOUNT_REPOSITORY,
                    useValue: mockAccountRepository,
                },
                {
                    provide: REFRESH_TOKENS_REPOSITORY,
                    useValue: mockRefreshTokensRepository,
                },
                {
                    provide: TEMPORARY_PASSWORDS_REPOSITORY,
                    useValue: mockTempPasswordsRepository,
                },
                {
                    provide: HASHING_SERVICE,
                    useValue: mockHashingService,
                },
                {
                    provide: JWT_SERVICE,
                    useValue: mockJwtService,
                },
                {
                    provide: EVENT_PUBLISHER,
                    useValue: mockEventPublisher,
                },
                {
                    provide: AUDIT_LOGS_REPOSITORY,
                    useValue: mockAuditLogsRepository,
                },
                {
                    provide: CreateDeviceSessionUseCase,
                    useValue: mockCreateDeviceSessionUseCase,
                },
                {
                    provide: LogDeviceActivityUseCase,
                    useValue: mockLogDeviceActivityUseCase,
                },
            ],
        }).compile();

        useCase = module.get<LoginUseCase>(LoginUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Helper to create login request DTO
    const createLoginRequest = (overrides = {}): LoginRequestDto => ({
        email: 'active@company.com',
        password: 'correct_password',
        device_id: MOCK_DEVICE_ID,
        device_name: 'iPhone 14',
        device_os: 'iOS 17',
        device_model: 'iPhone 14 Pro',
        platform: DevicePlatform.ANDROID,
        app_version: '1.0.0',
        fcm_token: MOCK_FCM_TOKEN,
        location: MOCK_LOCATION,
        ...overrides,
    });

    describe('execute', () => {
        /**
         * LTCID01: Successful login with all device info (EMPLOYEE role)
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN}
         * Input: Valid credentials with full device info
         * Output: Success response with tokens and user info
         */
        it('LTCID01: Successful login with all device info (EMPLOYEE role)', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.must_change_password).toBe(false);
            expectUserInfo(result.data!.user, account);
            expect(mocks.mockAccountRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
            expect(mocks.mockHashingService.compare).toHaveBeenCalledWith(loginDto.password, account.password_hash);
            expect(mocks.mockAccountRepository.updateLastLogin).toHaveBeenCalledWith(account.id, MOCK_IP_ADDRESS);
            expect(mocks.mockRefreshTokensRepository.create).toHaveBeenCalled();
            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_SUCCESS', true);
            expect(mocks.mockEventPublisher.publish).toHaveBeenCalledWith('user_logged_in', expect.any(Object));
            expectDeviceSession(mocks.mockCreateDeviceSessionUseCase, account.id!);
            expectDeviceActivity(mocks.mockLogDeviceActivityUseCase, ActivityType.LOGIN, ActivityStatus.SUCCESS);
        });

        /**
         * LTCID02: Successful login with ADMIN role
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN}
         * Input: Valid credentials for ADMIN account
         * Output: Success response with ADMIN role
         */
        it('LTCID02: Successful login with ADMIN role', async () => {
            // Arrange
            const account = createMockAccount({
                role: AccountRole.ADMIN,
                full_name: 'John Admin',
                employee_id: undefined,
            });
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.role).toBe(AccountRole.ADMIN);
            expect(result.data!.user.full_name).toBe('John Admin');
            expect(result.data!.user.employee_id).toBeUndefined();
        });

        /**
         * LTCID03: Successful login without optional device info
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN}
         * Input: Valid credentials without device_name
         * Output: Success response
         */
        it('LTCID03: Successful login without optional device info', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest({ device_name: undefined });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockCreateDeviceSessionUseCase.execute).toHaveBeenCalled();
        });

        /**
         * LTCID04: Successful login with HR_MANAGER role
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN}
         * Input: Valid credentials for HR_MANAGER account
         * Output: Success response with HR_MANAGER role
         */
        it('LTCID04: Successful login with HR_MANAGER role', async () => {
            // Arrange
            const account = createMockAccount({
                role: AccountRole.HR_MANAGER,
                full_name: 'Jane Manager',
                employee_id: 200,
            });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.role).toBe(AccountRole.HR_MANAGER);
            expect(result.data!.user.employee_id).toBe(200);
        });

        /**
         * LTCID05: Successful login with failed_login_attempts reset
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has failed_login_attempts = 3
         * Input: Valid credentials
         * Output: Success response + failed_login_attempts reset to 0
         */
        it('LTCID05: Successful login with failed_login_attempts reset', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 3 });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockAccountRepository.resetFailedLoginAttempts).toHaveBeenCalledWith(account.id);
        });

        /**
         * LTCID06: Successful login with failed_login_attempts = 4 reset
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has failed_login_attempts = 4
         * Input: Valid credentials
         * Output: Success response + failed_login_attempts reset to 0
         */
        it('LTCID06: Successful login with failed_login_attempts = 4 reset', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 4 });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockAccountRepository.resetFailedLoginAttempts).toHaveBeenCalledWith(account.id);
        });

        /**
         * LTCID07: Failed login - Account not found
         * Preconditions: ${PRECONDITIONS_LOGIN_NOT_FOUND}
         * Input: Email that doesn't exist
         * Output: UnauthorizedException 'Invalid credentials'
         */
        it('LTCID07: Failed login - Account not found', async () => {
            // Arrange
            const loginDto = createLoginRequest({ email: 'nonexistent@company.com' });
            setupLoginMocks(mocks, null, null, false);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            try {
                await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);
            } catch (error) {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect((error as UnauthorizedException).message).toBe('Invalid credentials');
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
            expect(mocks.mockRefreshTokensRepository.create).not.toHaveBeenCalled();
            expect(mocks.mockEventPublisher.publish).not.toHaveBeenCalled();
        });

        /**
         * LTCID08: Failed login - Wrong password
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN}
         * Input: Valid email but wrong password
         * Output: UnauthorizedException 'Invalid credentials' + failed attempts incremented
         */
        it('LTCID08: Failed login - Wrong password', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 0 });
            const loginDto = createLoginRequest({ password: 'wrong_password' });
            setupLoginMocks(mocks, account, null, false);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            expect(mocks.mockAccountRepository.incrementFailedLoginAttempts).toHaveBeenCalledWith(account.id);
            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
            expect(mocks.mockRefreshTokensRepository.create).not.toHaveBeenCalled();
        });

        /**
         * LTCID09: Failed login - Wrong password with 4 failed attempts (increment to 5)
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has failed_login_attempts = 4
         * Input: Valid email but wrong password
         * Output: UnauthorizedException + failed attempts incremented to 5
         */
        it('LTCID09: Failed login - Wrong password with 4 failed attempts (increment to 5)', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 4 });
            const loginDto = createLoginRequest({ password: 'wrong_password' });
            setupLoginMocks(mocks, account, null, false);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            expect(mocks.mockAccountRepository.lockAccount).toHaveBeenCalledWith(
                account.id,
                expect.any(Date)
            );
            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
        });

        /**
         * LTCID10: Failed login - Account already locked (5 failed attempts)
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has failed_login_attempts = 5
         * Input: Valid email but wrong password
         * Output: UnauthorizedException + account locked
         */
        it('LTCID10: Failed login - Account already locked (5 failed attempts)', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 5 });
            const loginDto = createLoginRequest({ password: 'wrong_password' });
            setupLoginMocks(mocks, account, null, false);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            expect(mocks.mockAccountRepository.lockAccount).toHaveBeenCalled();
        });

        /**
         * LTCID11: Successful login after previous failed attempts
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has failed_login_attempts = 2
         * Input: Valid credentials
         * Output: Success response + failed_login_attempts reset
         */
        it('LTCID11: Successful login after previous failed attempts', async () => {
            // Arrange
            const account = createMockAccount({ failed_login_attempts: 2 });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockAccountRepository.resetFailedLoginAttempts).toHaveBeenCalledWith(account.id);
        });

        /**
         * LTCID12: Failed login - Account temporarily locked
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has locked_until in future
         * Input: Valid credentials but account is locked
         * Output: UnauthorizedException 'Account is temporarily locked'
         */
        it('LTCID12: Failed login - Account temporarily locked', async () => {
            // Arrange
            const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
            const account = createMockAccount({ locked_until: futureDate });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            try {
                await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);
            } catch (error) {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect((error as UnauthorizedException).message).toBe(
                    'Account is temporarily locked due to too many failed login attempts'
                );
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
            expect(mocks.mockRefreshTokensRepository.create).not.toHaveBeenCalled();
        });

        /**
         * LTCID13: Successful login - Account unlocked (locked_until in past)
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has locked_until in past
         * Input: Valid credentials
         * Output: Success response + account unlocked
         */
        it('LTCID13: Successful login - Account unlocked (locked_until in past)', async () => {
            // Arrange
            const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
            const account = createMockAccount({ locked_until: pastDate, failed_login_attempts: 5 });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockAccountRepository.resetFailedLoginAttempts).toHaveBeenCalledWith(account.id);
        });

        /**
         * LTCID14: Successful login with temporary password (must_change_password = true)
         * Preconditions: ${PRECONDITIONS_LOGIN_WITH_TEMP_PASSWORD}
         * Input: Valid email with temporary password
         * Output: Success response with must_change_password = true
         */
        it('LTCID14: Successful login with temporary password (must_change_password = true)', async () => {
            // Arrange
            const account = createMockAccount();
            const tempPassword = createMockTemporaryPassword({ must_change_password: true });
            const loginDto = createLoginRequest({ password: 'temp_password123' });
            setupLoginMocks(mocks, account, tempPassword, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result, 'Login successful. Please change your temporary password.');
            expect(result.data!.must_change_password).toBe(true);
            expect(mocks.mockTempPasswordsRepository.findActiveByAccountId).toHaveBeenCalledWith(account.id);
            expect(mocks.mockAuditLogsRepository.create).toHaveBeenCalledTimes(2); // Once for temp password, once for success
        });

        /**
         * LTCID15: Failed login with expired temporary password
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account has expired temporary password
         * Input: Temporary password but it's expired
         * Output: UnauthorizedException 'Invalid credentials'
         */
        it('LTCID15: Failed login with expired temporary password', async () => {
            // Arrange
            const account = createMockAccount();
            const expiredTempPassword = createMockTemporaryPassword({
                expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired yesterday
            });
            const loginDto = createLoginRequest({ password: 'temp_password123' });
            setupLoginMocks(mocks, account, expiredTempPassword, false);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );
        });

        /**
         * LTCID16: Successful login with temporary password (must_change_password = false)
         * Preconditions: ${PRECONDITIONS_LOGIN_WITH_TEMP_PASSWORD}
         * Input: Valid email with temporary password (must_change_password = false)
         * Output: Success response with must_change_password = false
         */
        it('LTCID16: Successful login with temporary password (must_change_password = false)', async () => {
            // Arrange
            const account = createMockAccount();
            const tempPassword = createMockTemporaryPassword({ must_change_password: false });
            const loginDto = createLoginRequest({ password: 'temp_password123' });
            setupLoginMocks(mocks, account, tempPassword, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.must_change_password).toBe(false);
        });

        /**
         * LTCID17: Successful login with regular password when temp password exists
         * Preconditions: ${PRECONDITIONS_LOGIN_WITH_TEMP_PASSWORD}
         * Input: Regular password (not temp password)
         * Output: Success response
         */
        it('LTCID17: Successful login with regular password when temp password exists', async () => {
            // Arrange
            const account = createMockAccount();
            const tempPassword = createMockTemporaryPassword();
            const loginDto = createLoginRequest({ password: 'correct_password' });

            // Setup mocks to fail temp password comparison but succeed with regular password
            setupLoginMocks(mocks, account, tempPassword, true);
            mocks.mockHashingService.compare
                .mockResolvedValueOnce(false) // temp password fails
                .mockResolvedValueOnce(true); // regular password succeeds

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.must_change_password).toBe(false);
            expect(mocks.mockHashingService.compare).toHaveBeenCalledTimes(2);
        });

        /**
         * LTCID18: Failed login - Account status SUSPENDED
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account status = SUSPENDED
         * Input: Valid credentials but account is suspended
         * Output: UnauthorizedException 'Account has been suspended'
         */
        it('LTCID18: Failed login - Account status SUSPENDED', async () => {
            // Arrange
            const account = createMockAccount({ status: AccountStatus.SUSPENDED });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            try {
                await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);
            } catch (error) {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect((error as UnauthorizedException).message).toBe(
                    'Account has been suspended. Please contact administrator.'
                );
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
            expect(mocks.mockRefreshTokensRepository.create).not.toHaveBeenCalled();
        });

        /**
         * LTCID19: Failed login - Account status LOCKED
         * Preconditions: ${PRECONDITIONS_BASIC_LOGIN} + Account status = LOCKED
         * Input: Valid credentials but account status is LOCKED
         * Output: UnauthorizedException 'Account has been locked'
         */
        it('LTCID19: Failed login - Account status LOCKED', async () => {
            // Arrange
            const account = createMockAccount({ status: AccountStatus.LOCKED });
            const loginDto = createLoginRequest({
                device_name: 'Samsung Galaxy S23',
                device_os: 'Android 14',
            });
            setupLoginMocks(mocks, account, null, true);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            try {
                await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);
            } catch (error) {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect((error as UnauthorizedException).message).toBe(
                    'Account has been locked. Please contact administrator.'
                );
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
        });

        /**
         * LTCID20: Failed login - Account status INACTIVE
         * Preconditions: ${PRECONDITIONS_LOGIN_INACTIVE}
         * Input: Valid credentials but account is inactive
         * Output: UnauthorizedException 'Account is inactive'
         */
        it('LTCID20: Failed login - Account status INACTIVE', async () => {
            // Arrange
            const account = createMockAccount({
                email: 'inactive@company.com',
                status: AccountStatus.INACTIVE,
            });
            const loginDto = createLoginRequest({ email: 'inactive@company.com' });
            setupLoginMocks(mocks, account, null, true);

            // Act & Assert
            await expect(useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT)).rejects.toThrow(
                UnauthorizedException
            );

            try {
                await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);
            } catch (error) {
                expect(error).toBeInstanceOf(UnauthorizedException);
                expect((error as UnauthorizedException).message).toBe(
                    'Account is inactive. Please contact administrator.'
                );
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
            expect(mocks.mockRefreshTokensRepository.create).not.toHaveBeenCalled();
        });

        /**
         * Additional test: Device session creation failure should not prevent login
         */
        it('Should continue login even if device session creation fails', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);
            mocks.mockCreateDeviceSessionUseCase.execute.mockRejectedValue(new Error('Device session error'));

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockRefreshTokensRepository.create).toHaveBeenCalled();
        });

        /**
         * Additional test: Verify refresh token is created with correct data
         */
        it('Should create refresh token with correct data', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expect(mocks.mockRefreshTokensRepository.create).toHaveBeenCalled();
            const refreshTokenCall = mocks.mockRefreshTokensRepository.create.mock.calls[0][0];
            expect(refreshTokenCall.account_id).toBe(account.id);
            expect(refreshTokenCall.token_hash).toBeDefined();
            expect(refreshTokenCall.ip_address).toBe(MOCK_IP_ADDRESS);
            expect(refreshTokenCall.user_agent).toBe(MOCK_USER_AGENT);
        });

    });
});
