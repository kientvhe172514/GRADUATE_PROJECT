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
    EMPLOYEE_PROFILE_SERVICE,
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

        const mockEmployeeProfileService = {
            getManagedDepartmentIds: jest.fn(),
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
                {
                    provide: EMPLOYEE_PROFILE_SERVICE,
                    useValue: mockEmployeeProfileService,
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
         * @id LTCID01
         * @description Successful login with all device info (EMPLOYEE role)
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID02
         * @description Successful login with ADMIN role
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Admin", role:"ADMIN", employee_id:undefined}}}
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
         * @id LTCID03
         * @description Successful login without optional device info
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID04
         * @description Successful login with HR_MANAGER role
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"Jane Manager", role:"HR_MANAGER", employee_id:200}}}
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
         * @id LTCID05
         * @description Successful login with failed_login_attempts reset
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID06
         * @description Successful login with failed_login_attempts = 4 reset
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID07
         * @description Failed login - Account not found
         * @type A
         * @output "Invalid credentials"
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
         * @id LTCID08
         * @description Failed login - Wrong password
         * @type A
         * @output "Invalid credentials"
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
         * @id LTCID09
         * @description Failed login - Wrong password with 4 failed attempts (increment to 5)
         * @type A
         * @output "Invalid credentials"
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
         * @id LTCID10
         * @description Failed login - Account already locked (5 failed attempts)
         * @type A
         * @output "Invalid credentials"
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
         * @id LTCID11
         * @description Successful login after previous failed attempts
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID12
         * @description Failed login - Account temporarily locked
         * @type B
         * @output "Account is temporarily locked due to too many failed login attempts"
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
         * @id LTCID13
         * @description Successful login - Account unlocked (locked_until in past)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID14
         * @description Successful login with temporary password (must_change_password = true)
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful. Please change your temporary password.", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:true, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID15
         * @description Failed login with expired temporary password
         * @type A
         * @output "Invalid credentials"
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
         * @id LTCID16
         * @description Successful login with temporary password (must_change_password = false)
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID17
         * @description Successful login with regular password when temp password exists
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
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
         * @id LTCID18
         * @description Failed login - Account status SUSPENDED
         * @type A
         * @output "Account has been suspended. Please contact administrator."
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
         * @id LTCID19
         * @description Failed login - Account status LOCKED
         * @type A
         * @output "Account has been locked. Please contact administrator."
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
         * @id LTCID20
         * @description Failed login - Account status INACTIVE
         * @type A
         * @output "Account is inactive. Please contact administrator."
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
         * @id LTCID21
         * @description Successful login for DEPARTMENT_MANAGER with managed departments
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"DEPARTMENT_MANAGER", employee_id:200, managed_department_ids:[10]}}}
         */
        it('LTCID21: Successful login for DEPARTMENT_MANAGER with managed departments', async () => {
            // Arrange
            const account = createMockAccount({
                role: AccountRole.DEPARTMENT_MANAGER,
                role_id: 3,
                employee_id: 200,
            });
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Mock employeeProfileService to return department IDs
            const mockEmployeeProfileService = (useCase as any).employeeProfileService;
            mockEmployeeProfileService.getManagedDepartmentIds = jest.fn().mockResolvedValue([10, 20, 30]);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.role).toBe(AccountRole.DEPARTMENT_MANAGER);
            expect(result.data!.user.employee_id).toBe(200);
            expect(result.data!.user.managed_department_ids).toEqual([10, 20, 30]);
            expect(mockEmployeeProfileService.getManagedDepartmentIds).toHaveBeenCalledWith(200);
        });

        /**
         * @id LTCID22
         * @description Successful login for DEPARTMENT_MANAGER when getManagedDepartmentIds fails
         * @type A
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"DEPARTMENT_MANAGER", employee_id:200, managed_department_ids:undefined}}}
         */
        it('LTCID22: Successful login for DEPARTMENT_MANAGER when getManagedDepartmentIds fails', async () => {
            // Arrange
            const account = createMockAccount({
                role: AccountRole.DEPARTMENT_MANAGER,
                role_id: 3,
                employee_id: 200,
            });
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Mock employeeProfileService to throw error
            const mockEmployeeProfileService = (useCase as any).employeeProfileService;
            mockEmployeeProfileService.getManagedDepartmentIds = jest.fn().mockRejectedValue(
                new Error('Failed to fetch managed departments')
            );

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.role).toBe(AccountRole.DEPARTMENT_MANAGER);
            expect(result.data!.user.employee_id).toBe(200);
            expect(result.data!.user.managed_department_ids).toBeUndefined();
            expect(mockEmployeeProfileService.getManagedDepartmentIds).toHaveBeenCalledWith(200);
        });

        /**
         * @id LTCID23
         * @description Successful login continues when device tracking fails
         * @type A
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID23: Successful login continues when device tracking fails', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);
            mocks.mockLogDeviceActivityUseCase.execute.mockRejectedValue(new Error('Device tracking error'));

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockRefreshTokensRepository.create).toHaveBeenCalled();
        });

        /**
         * @id LTCID24
         * @description Failed login - Account status unknown/invalid
         * @type A
         * @output "Account is not active. Please contact administrator."
         */
        it('LTCID23: Failed login - Account status unknown/invalid', async () => {
            // Arrange
            const account = createMockAccount({ status: 'UNKNOWN' as any });
            const loginDto = createLoginRequest();
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
                    'Account is not active. Please contact administrator.'
                );
            }

            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_FAILED', false);
        });

        /**
         * @id LTCID25
         * @description Successful login without ipAddress parameter
         * @type N
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID25: Successful login without ipAddress parameter', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, undefined, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockAccountRepository.updateLastLogin).not.toHaveBeenCalled();
        });

        /**
         * @id LTCID26
         * @description Successful login without device_id (fallback to web_timestamp)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID26: Successful login without device_id (fallback to web_timestamp)', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest({ device_id: undefined });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockCreateDeviceSessionUseCase.execute).toHaveBeenCalled();
            const deviceCall = mocks.mockCreateDeviceSessionUseCase.execute.mock.calls[0][0];
            expect(deviceCall.device_id).toMatch(/^web_\d+$/);
        });

        /**
         * @id LTCID27
         * @description Successful login without platform (fallback to WEB)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID27: Successful login without platform (fallback to WEB)', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest({ platform: undefined });
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockCreateDeviceSessionUseCase.execute).toHaveBeenCalled();
            const deviceCall = mocks.mockCreateDeviceSessionUseCase.execute.mock.calls[0][0];
            expect(deviceCall.platform).toBe('WEB');
        });

        /**
         * @id LTCID28
         * @description Successful login with null full_name (fallback to empty string)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID28: Successful login with null full_name (fallback to empty string)', async () => {
            // Arrange
            const account = createMockAccount({ full_name: null as any });
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.full_name).toBe('');
        });

        /**
         * @id LTCID29
         * @description Successful login with null role (fallback to empty string)
         * @type B
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"", employee_id:100}}}
         */
        it('LTCID29: Successful login with null role (fallback to empty string)', async () => {
            // Arrange
            const account = createMockAccount({ role: null as any });
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.user.role).toBe('');
        });

        /**
         * @id LTCID30
         * @description Successful login continues when device session creation fails
         * @type A
         * @output {status:"SUCCESS", statusCode:200, message:"Login successful", data:{access_token:"jwt_access_token", refresh_token:"jwt_refresh_token", must_change_password:false, user:{id:1, email:"active@company.com", full_name:"John Doe", role:"EMPLOYEE", employee_id:100}}}
         */
        it('LTCID30: Successful login continues when device session creation fails', async () => {
            // Arrange
            const account = createMockAccount();
            const loginDto = createLoginRequest();
            setupLoginMocks(mocks, account, null, true);

            // Mock device session creation failure
            mocks.mockCreateDeviceSessionUseCase.execute.mockRejectedValue(new Error('Device session error'));

            // Act
            const result = await useCase.execute(loginDto, MOCK_IP_ADDRESS, MOCK_USER_AGENT);

            // Assert
            expectSuccessResponse(result);
            expect(mocks.mockCreateDeviceSessionUseCase.execute).toHaveBeenCalled();
            // Should still log audit
            expectAuditLog(mocks.mockAuditLogsRepository, 'LOGIN_SUCCESS', true);
        });

    });
});
