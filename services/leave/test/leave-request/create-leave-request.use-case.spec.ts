import { Test, TestingModule } from '@nestjs/testing';
import { CreateLeaveRequestUseCase } from '../../src/application/leave-record/use-cases/create-leave-request.use-case';
import { CreateLeaveRequestDto } from '../../src/application/leave-record/dto/leave-record.dto';
import { ILeaveRecordRepository } from '../../src/application/ports/leave-record.repository.interface';
import { ILeaveTypeRepository } from '../../src/application/ports/leave-type.repository.interface';
import { ILeaveBalanceRepository } from '../../src/application/ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../src/application/ports/leave-balance-transaction.repository.interface';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import {
    LEAVE_RECORD_REPOSITORY,
    LEAVE_TYPE_REPOSITORY,
    LEAVE_BALANCE_REPOSITORY,
    LEAVE_BALANCE_TRANSACTION_REPOSITORY,
    EVENT_PUBLISHER,
} from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ClientProxy } from '@nestjs/microservices';
import { throwError } from 'rxjs';
import {
    createMockLeaveRecord,
    setupCreateLeaveRequestMocks,
    expectLeaveRecordCreated,
    expectBalanceUpdated,
    expectTransactionCreated,
    expectEventPublished,
    expectRepositoryCalls,
    calculateExpectedWorkingDays,
    MockRepositories,
    MOCK_EMPLOYEE_ID,
    MOCK_EMPLOYEE_CODE,
    MOCK_DEPARTMENT_ID,
    MOCK_LEAVE_TYPE_ID,
    MOCK_EMPLOYEE_INFO,
    MOCK_LEAVE_TYPE,
    MOCK_LEAVE_TYPE_NO_DEDUCT,
    MOCK_LEAVE_BALANCE,
    PRECONDITIONS_BASIC_CREATE,
} from './mock-helpers';

describe('CreateLeaveRequestUseCase', () => {
    let useCase: CreateLeaveRequestUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockLeaveRecordRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            findByDateRange: jest.fn(),
            findByEmployeeId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const mockLeaveTypeRepository = {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        };

        const mockLeaveBalanceRepository = {
            findByEmployeeLeaveTypeAndYear: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            findByEmployeeId: jest.fn(),
        };

        const mockTransactionRepository = {
            create: jest.fn(),
            findByEmployeeId: jest.fn(),
        };

        const mockEventPublisher = {
            publish: jest.fn(),
        };

        const mockEmployeeService = {
            send: jest.fn(),
            emit: jest.fn(),
            connect: jest.fn(),
            close: jest.fn(),
        };

        mocks = {
            mockLeaveRecordRepository: mockLeaveRecordRepository as any,
            mockLeaveTypeRepository: mockLeaveTypeRepository as any,
            mockLeaveBalanceRepository: mockLeaveBalanceRepository as any,
            mockTransactionRepository: mockTransactionRepository as any,
            mockEventPublisher: mockEventPublisher as any,
            mockEmployeeService: mockEmployeeService as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateLeaveRequestUseCase,
                {
                    provide: LEAVE_RECORD_REPOSITORY,
                    useValue: mockLeaveRecordRepository,
                },
                {
                    provide: LEAVE_TYPE_REPOSITORY,
                    useValue: mockLeaveTypeRepository,
                },
                {
                    provide: LEAVE_BALANCE_REPOSITORY,
                    useValue: mockLeaveBalanceRepository,
                },
                {
                    provide: LEAVE_BALANCE_TRANSACTION_REPOSITORY,
                    useValue: mockTransactionRepository,
                },
                {
                    provide: EVENT_PUBLISHER,
                    useValue: mockEventPublisher,
                },
                {
                    provide: 'EMPLOYEE_SERVICE',
                    useValue: mockEmployeeService,
                },
            ],
        }).compile();

        useCase = module.get<CreateLeaveRequestUseCase>(CreateLeaveRequestUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * CLRTC01: Create leave request with all fields and supporting document
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto with all fields (3 days, Mon-Wed)
         * Output: Success response with leave record created, balance updated, transaction created, event published
         */
        it('CLRTC01: Create leave request with all fields and supporting document', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10', // Monday
                end_date: '2025-03-12', // Wednesday
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
                supporting_document_url: 'https://example.com/doc.pdf',
            };

            const createdRecord = createMockLeaveRecord({
                supporting_document_url: dto.supporting_document_url,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expectLeaveRecordCreated(result, {
                employee_id: MOCK_EMPLOYEE_ID,
                employee_code: MOCK_EMPLOYEE_CODE,
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                total_calendar_days: 3,
                total_working_days: 3,
                total_leave_days: 3,
            });
            expect(result.supporting_document_url).toBe(dto.supporting_document_url);
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 5, 7); // pending: 2+3=5, remaining: 10-3=7
            expectTransactionCreated(mocks.mockTransactionRepository);
            expectEventPublished(mocks.mockEventPublisher);
            expectRepositoryCalls(mocks, true);
        });

        /**
         * CLRTC02: Create leave request for 5 days (Mon-Fri)
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto for 5 working days
         * Output: Success response with correct working days calculation
         */
        it('CLRTC02: Create leave request for 5 days (Mon-Fri)', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10', // Monday
                end_date: '2025-03-14', // Friday
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-14'),
                total_calendar_days: 5,
                total_working_days: 5,
                total_leave_days: 5,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expectLeaveRecordCreated(result, {
                employee_id: MOCK_EMPLOYEE_ID,
                employee_code: MOCK_EMPLOYEE_CODE,
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                total_calendar_days: 5,
                total_working_days: 5,
                total_leave_days: 5,
            });
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 7, 5); // pending: 2+5=7, remaining: 10-5=5
        });

        /**
         * CLRTC03: Create leave request with half day start
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto with is_half_day_start = true
         * Output: Success response with working days reduced by 0.5
         */
        it('CLRTC03: Create leave request with half day start', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10', // Monday
                end_date: '2025-03-14', // Friday
                is_half_day_start: true,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const expectedWorkingDays = calculateExpectedWorkingDays(
                new Date('2025-03-10'),
                new Date('2025-03-14'),
                true,
                false
            );

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-14'),
                total_calendar_days: 5,
                total_working_days: expectedWorkingDays,
                total_leave_days: expectedWorkingDays,
                is_half_day_start: true,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expect(result.total_working_days).toBe(4.5);
            expect(result.is_half_day_start).toBe(true);
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 6.5, 5.5); // pending: 2+4.5=6.5, remaining: 10-4.5=5.5
        });

        /**
         * CLRTC04: Create leave request with half day end
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto with is_half_day_end = true
         * Output: Success response with working days reduced by 0.5
         */
        it('CLRTC04: Create leave request with half day end', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10', // Monday
                end_date: '2025-03-14', // Friday
                is_half_day_start: false,
                is_half_day_end: true,
                reason: 'Family emergency',
            };

            const expectedWorkingDays = calculateExpectedWorkingDays(
                new Date('2025-03-10'),
                new Date('2025-03-14'),
                false,
                true
            );

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-14'),
                total_calendar_days: 5,
                total_working_days: expectedWorkingDays,
                total_leave_days: expectedWorkingDays,
                is_half_day_end: true,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expect(result.total_working_days).toBe(4.5);
            expect(result.is_half_day_end).toBe(true);
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 6.5, 5.5);
        });

        /**
         * CLRTC05: Create leave request excluding weekends
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto spanning weekend (Mon-Sun, 7 calendar days, 5 working days)
         * Output: Success response with correct working days (weekends excluded)
         */
        it('CLRTC05: Create leave request excluding weekends', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10', // Monday
                end_date: '2025-03-16', // Sunday (covers Mon-Sun = 7 calendar days, 5 working days)
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            // For Mon-Sun: 7 calendar days but only 5 working days (Sat-Sun excluded)
            const expectedWorkingDays = 5;

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-16'),
                total_calendar_days: 7,
                total_working_days: expectedWorkingDays,
                total_leave_days: expectedWorkingDays,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expect(result.total_working_days).toBe(5);
            expect(result.total_calendar_days).toBe(7);
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 7, 5); // pending: 2+5=7, remaining: 10-5=5
        });

        /**
         * CLRTC06: Create leave request with leave type that doesn't deduct from balance
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE} + Leave type has deducts_from_balance = false
         * Input: CreateLeaveRequestDto with leave type that doesn't deduct
         * Output: Success response without balance update or transaction creation
         */
        it('CLRTC06: Create leave request with leave type that doesn\'t deduct from balance', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-14'),
                total_calendar_days: 5,
                total_working_days: 5,
                total_leave_days: 5,
            });

            setupCreateLeaveRequestMocks(mocks, {
                leaveType: MOCK_LEAVE_TYPE_NO_DEDUCT,
                createdLeaveRecord: createdRecord,
            });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expectLeaveRecordCreated(result, {
                employee_id: MOCK_EMPLOYEE_ID,
                employee_code: MOCK_EMPLOYEE_CODE,
                leave_type_id: MOCK_LEAVE_TYPE_ID,
            });
            expect(mocks.mockLeaveBalanceRepository.findByEmployeeLeaveTypeAndYear).not.toHaveBeenCalled();
            expect(mocks.mockLeaveBalanceRepository.update).not.toHaveBeenCalled();
            expect(mocks.mockTransactionRepository.create).not.toHaveBeenCalled();
            expectEventPublished(mocks.mockEventPublisher);
        });

        /**
         * CLRTC07: Create leave request successfully with sufficient balance
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto requiring 5 days with 10 days available
         * Output: Success response with balance updated
         */
        it('CLRTC07: Create leave request successfully with sufficient balance', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const createdRecord = createMockLeaveRecord({
                end_date: new Date('2025-03-14'),
                total_calendar_days: 5,
                total_working_days: 5,
                total_leave_days: 5,
            });

            setupCreateLeaveRequestMocks(mocks, { createdLeaveRecord: createdRecord });

            // Act
            const result = await useCase.execute(dto, MOCK_EMPLOYEE_ID);

            // Assert
            expectLeaveRecordCreated(result, {
                employee_id: MOCK_EMPLOYEE_ID,
                employee_code: MOCK_EMPLOYEE_CODE,
                leave_type_id: MOCK_LEAVE_TYPE_ID,
            });
            expectBalanceUpdated(mocks.mockLeaveBalanceRepository, 1, 7, 5);
        });

        /**
         * CLRTC08: Throw error when overlapping with PENDING leave request
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE} + Overlapping PENDING leave request exists
         * Input: CreateLeaveRequestDto with overlapping dates
         * Output: BusinessException LEAVE_REQUEST_OVERLAPS
         */
        it('CLRTC08: Throw error when overlapping with PENDING leave request', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const overlappingLeave = createMockLeaveRecord({
                status: 'PENDING',
                start_date: new Date('2025-03-11'),
                end_date: new Date('2025-03-13'),
            });

            setupCreateLeaveRequestMocks(mocks, {
                overlappingLeaves: [overlappingLeave],
            });

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.LEAVE_REQUEST_OVERLAPS);
                expect((error as BusinessException).message).toBe(
                    'You already have a pending or approved leave request during this period'
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC09: Throw error when overlapping with APPROVED leave request
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE} + Overlapping APPROVED leave request exists
         * Input: CreateLeaveRequestDto with overlapping dates
         * Output: BusinessException LEAVE_REQUEST_OVERLAPS
         */
        it('CLRTC09: Throw error when overlapping with APPROVED leave request', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const overlappingLeave = createMockLeaveRecord({
                status: 'APPROVED',
                start_date: new Date('2025-03-11'),
                end_date: new Date('2025-03-13'),
            });

            setupCreateLeaveRequestMocks(mocks, {
                overlappingLeaves: [overlappingLeave],
            });

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.LEAVE_REQUEST_OVERLAPS);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC10: Throw error when insufficient leave balance
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE} + Leave balance has only 2 days remaining
         * Input: CreateLeaveRequestDto requiring 5 days
         * Output: BusinessException INSUFFICIENT_LEAVE_BALANCE
         */
        it('CLRTC10: Throw error when insufficient leave balance', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            const insufficientBalance = {
                ...MOCK_LEAVE_BALANCE,
                remaining_days: 2, // Only 2 days available, but requesting 5
            };

            setupCreateLeaveRequestMocks(mocks, {
                leaveBalance: insufficientBalance,
            });

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.INSUFFICIENT_LEAVE_BALANCE);
                expect((error as BusinessException).message).toContain('Required: 5.00 days');
                expect((error as BusinessException).message).toContain('Available: 2.00 days');
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC11: Throw error when leave balance not found
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE} + Leave balance does NOT exist
         * Input: CreateLeaveRequestDto
         * Output: BusinessException LEAVE_BALANCE_NOT_FOUND
         */
        it('CLRTC11: Throw error when leave balance not found', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            setupCreateLeaveRequestMocks(mocks, {
                leaveBalance: null,
            });

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.LEAVE_BALANCE_NOT_FOUND);
                expect((error as BusinessException).message).toBe(
                    'Leave balance not found. Please contact HR to initialize your leave balance.'
                );
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC12: Throw error when leave type not found
         * Preconditions: Database connected + Leave type with ID 999 does NOT exist
         * Input: CreateLeaveRequestDto with non-existent leave type
         * Output: BusinessException LEAVE_TYPE_NOT_FOUND
         */
        it('CLRTC12: Throw error when leave type not found', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: 999,
                start_date: '2025-03-10',
                end_date: '2025-03-14',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            setupCreateLeaveRequestMocks(mocks, {
                leaveType: null,
            });

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.LEAVE_TYPE_NOT_FOUND);
                expect((error as BusinessException).message).toBe('Leave type not found');
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC13: Throw error when start date is after end date
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateLeaveRequestDto with start_date > end_date
         * Output: BusinessException INVALID_LEAVE_DATE_RANGE
         */
        it('CLRTC13: Throw error when start date is after end date', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-14',
                end_date: '2025-03-10', // End date before start date
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            setupCreateLeaveRequestMocks(mocks);

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_EMPLOYEE_ID)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_EMPLOYEE_ID);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.INVALID_LEAVE_DATE_RANGE);
                expect((error as BusinessException).message).toBe('Start date must be before or equal to end date');
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });

        /**
         * CLRTC14: Throw error when employee not found
         * Preconditions: Database connected + Employee with ID 999 does NOT exist
         * Input: CreateLeaveRequestDto with non-existent employee ID
         * Output: BusinessException EMPLOYEE_NOT_FOUND
         */
        it('CLRTC14: Throw error when employee not found', async () => {
            // Arrange
            const dto: CreateLeaveRequestDto = {
                leave_type_id: MOCK_LEAVE_TYPE_ID,
                start_date: '2025-03-10',
                end_date: '2025-03-12',
                is_half_day_start: false,
                is_half_day_end: false,
                reason: 'Family emergency',
            };

            // Mock employee service to throw error
            mocks.mockEmployeeService.send.mockReturnValue(throwError(() => new Error('Employee not found')));

            // Act & Assert
            await expect(useCase.execute(dto, 999)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, 999);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.EMPLOYEE_NOT_FOUND);
                expect((error as BusinessException).message).toBe(
                    'Employee information not found. Please ensure your employee profile exists.'
                );
                expect((error as BusinessException).statusCode).toBe(404);
            }

            expect(mocks.mockLeaveRecordRepository.create).not.toHaveBeenCalled();
        });
    });
});
