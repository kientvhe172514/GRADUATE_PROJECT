import { Test, TestingModule } from '@nestjs/testing';
import { CreateWorkScheduleUseCase } from '../../src/application/use-cases/work-schedule/create-work-schedule.use-case';
import { CreateWorkScheduleDto } from '../../src/application/dtos/work-schedule.dto';
import { IWorkScheduleRepository } from '../../src/application/ports/work-schedule.repository.port';
import { WORK_SCHEDULE_REPOSITORY } from '../../src/application/tokens';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ScheduleType, ScheduleStatus } from '../../src/domain/entities/work-schedule.entity';
import {
    createMockWorkSchedule,
    setupCreateWorkScheduleMocks,
    expectSuccessResponse,
    expectWorkScheduleData,
    expectRepositoryCalls,
    expectUserTracking,
    expectDefaultValues,
    MockRepositories,
    MOCK_USER,
    PRECONDITIONS_BASIC_CREATE,
    PRECONDITIONS_DUPLICATE_NAME,
} from './mock-helpers';
import * as fs from 'fs';
import * as path from 'path';

// Metadata for CSV export. Kept in sync with test cases below.
const TEST_CASES: Array<{
    id: string;
    title: string;
    preconditions: string;
    inputSummary: string;
    expectedOutcome: string;
}> = [
    {
        id: 'CWSTC01',
        title: 'Create FIXED work schedule with all fields',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FIXED with work_days,start_time,end_time,break/late/early values',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC02',
        title: 'Create FLEXIBLE work schedule',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FLEXIBLE type (no work_days/start_time/end_time)',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC03',
        title: 'Create SHIFT_BASED work schedule',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'SHIFT_BASED type',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC04',
        title: 'Create FIXED schedule with all fields specified',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FIXED with all optional fields',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC05',
        title: 'Create FIXED schedule with minimal required fields',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FIXED with only required fields',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC06',
        title: 'Create FLEXIBLE schedule with minimal fields',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FLEXIBLE minimal',
        expectedOutcome: 'Success (created schedule) - 201',
    },
    {
        id: 'CWSTC07',
        title: 'Throw error when FIXED schedule missing required fields',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FIXED missing work_days/start_time/end_time',
        expectedOutcome: 'BusinessException INVALID_SCHEDULE_CONFIG (400)',
    },
    {
        id: 'CWSTC08',
        title: 'Throw error when schedule name already exists',
        preconditions: PRECONDITIONS_DUPLICATE_NAME,
        inputSummary: 'Existing schedule name provided',
        expectedOutcome: 'BusinessException SCHEDULE_NAME_ALREADY_EXISTS (409)',
    },
    {
        id: 'ADDITIONAL-1',
        title: 'CWSTC09: set created_by and updated_by from currentUser',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'Custom user payload',
        expectedOutcome: 'savedSchedule.created_by/updated_by match currentUser',
    },
    {
        id: 'ADDITIONAL-2',
        title: 'CWSTC09 set status to ACTIVE by default',
        preconditions: PRECONDITIONS_BASIC_CREATE,
        inputSummary: 'FLEXIBLE minimal',
        expectedOutcome: 'status === ACTIVE',
    },
];

describe('CreateWorkScheduleUseCase', () => {
    let useCase: CreateWorkScheduleUseCase;
    let mocks: MockRepositories;

    beforeEach(async () => {
        // Create mock implementations
        const mockWorkScheduleRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByName: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        mocks = {
            mockWorkScheduleRepository: mockWorkScheduleRepository as any,
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateWorkScheduleUseCase,
                {
                    provide: WORK_SCHEDULE_REPOSITORY,
                    useValue: mockWorkScheduleRepository,
                },
            ],
        }).compile();

        useCase = module.get<CreateWorkScheduleUseCase>(CreateWorkScheduleUseCase);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('execute', () => {
        /**
         * CWSTC01: Create FIXED work schedule with all fields
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FIXED type and all fields
         * Output: Success response with created schedule
         */
        it('CWSTC01: Create FIXED work schedule with all fields', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Standard Office Hours',
                schedule_type: ScheduleType.FIXED,
                work_days: '1,2,3,4,5',
                start_time: '08:00:00',
                end_time: '17:00:00',
                break_duration_minutes: 60,
                late_tolerance_minutes: 15,
                early_leave_tolerance_minutes: 15,
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
                break_duration_minutes: dto.break_duration_minutes,
                late_tolerance_minutes: dto.late_tolerance_minutes,
                early_leave_tolerance_minutes: dto.early_leave_tolerance_minutes,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectWorkScheduleData(result.data, {
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
            });
            expectRepositoryCalls(mocks.mockWorkScheduleRepository, dto.schedule_name);
            expectUserTracking(mocks.mockWorkScheduleRepository, MOCK_USER.sub);
            expect(result.data!.break_duration_minutes).toBe(60);
            expect(result.data!.late_tolerance_minutes).toBe(15);
            expect(result.data!.early_leave_tolerance_minutes).toBe(15);
        });

        /**
         * CWSTC02: Create FLEXIBLE work schedule
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FLEXIBLE type (no work_days, start_time, end_time)
         * Output: Success response with default values
         */
        it('CWSTC02: Create FLEXIBLE work schedule', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Flexible Work Schedule',
                schedule_type: ScheduleType.FLEXIBLE,
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: undefined,
                start_time: undefined,
                end_time: undefined,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.schedule_name).toBe(dto.schedule_name);
            expect(result.data!.schedule_type).toBe(ScheduleType.FLEXIBLE);
            expect(result.data!.work_days).toBeUndefined();
            expect(result.data!.start_time).toBeUndefined();
            expect(result.data!.end_time).toBeUndefined();
            expectDefaultValues(result.data);
            expectUserTracking(mocks.mockWorkScheduleRepository, MOCK_USER.sub);
        });

        /**
         * CWSTC03: Create SHIFT_BASED work schedule
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with SHIFT_BASED type
         * Output: Success response
         */
        it('CWSTC03: Create SHIFT_BASED work schedule', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Shift Based Schedule',
                schedule_type: ScheduleType.SHIFT_BASED,
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: undefined,
                start_time: undefined,
                end_time: undefined,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.schedule_name).toBe(dto.schedule_name);
            expect(result.data!.schedule_type).toBe(ScheduleType.SHIFT_BASED);
            expectDefaultValues(result.data);
        });

        /**
         * CWSTC04: Create FIXED schedule with all fields specified
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FIXED type and all optional fields
         * Output: Success response with all specified values
         */
        it('CWSTC04: Create FIXED schedule with all fields specified', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Fixed Schedule with All Fields',
                schedule_type: ScheduleType.FIXED,
                work_days: '1,2,3,4,5',
                start_time: '08:00:00',
                end_time: '17:00:00',
                break_duration_minutes: 60,
                late_tolerance_minutes: 15,
                early_leave_tolerance_minutes: 15,
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
                break_duration_minutes: dto.break_duration_minutes,
                late_tolerance_minutes: dto.late_tolerance_minutes,
                early_leave_tolerance_minutes: dto.early_leave_tolerance_minutes,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectWorkScheduleData(result.data, {
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
            });
            expect(result.data!.break_duration_minutes).toBe(60);
            expect(result.data!.late_tolerance_minutes).toBe(15);
            expect(result.data!.early_leave_tolerance_minutes).toBe(15);
        });

        /**
         * CWSTC05: Create FIXED schedule with minimal required fields
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FIXED type and only required fields
         * Output: Success response with default values for optional fields
         */
        it('CWSTC05: Create FIXED schedule with minimal required fields', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Fixed Schedule Minimal Fields',
                schedule_type: ScheduleType.FIXED,
                work_days: '1,2,3,4,5',
                start_time: '08:00:00',
                end_time: '17:00:00',
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expectWorkScheduleData(result.data, {
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: dto.work_days,
                start_time: dto.start_time,
                end_time: dto.end_time,
            });
            expectDefaultValues(result.data);
        });

        /**
         * CWSTC06: Create FLEXIBLE schedule with minimal fields
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FLEXIBLE type and only required fields
         * Output: Success response with default values
         */
        it('CWSTC06: Create FLEXIBLE schedule with minimal fields', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Flexible Schedule Minimal',
                schedule_type: ScheduleType.FLEXIBLE,
            };

            const savedSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
                schedule_type: dto.schedule_type,
                work_days: undefined,
                start_time: undefined,
                end_time: undefined,
            });

            setupCreateWorkScheduleMocks(mocks, null, savedSchedule);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expectSuccessResponse(result);
            expect(result.data!.schedule_name).toBe(dto.schedule_name);
            expect(result.data!.schedule_type).toBe(ScheduleType.FLEXIBLE);
            expectDefaultValues(result.data);
        });

        /**
         * CWSTC07: Throw error when FIXED schedule missing required fields
         * Preconditions: ${PRECONDITIONS_BASIC_CREATE}
         * Input: CreateWorkScheduleDto with FIXED type but missing work_days
         * Output: BusinessException INVALID_SCHEDULE_CONFIG
         */
        it('CWSTC07: Throw error when FIXED schedule missing required fields', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Standard Office Hours',
                schedule_type: ScheduleType.FIXED,
                // Missing work_days, start_time, end_time
            };

            setupCreateWorkScheduleMocks(mocks, null);

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.INVALID_SCHEDULE_CONFIG);
                expect((error as BusinessException).message).toBe(
                    'Fixed schedules require start time, end time, and work days.'
                );
                expect((error as BusinessException).statusCode).toBe(400);
            }

            expect(mocks.mockWorkScheduleRepository.findByName).toHaveBeenCalledWith(dto.schedule_name);
            expect(mocks.mockWorkScheduleRepository.save).not.toHaveBeenCalled();
        });

        /**
         * CWSTC08: Throw error when schedule name already exists
         * Preconditions: ${PRECONDITIONS_DUPLICATE_NAME}
         * Input: CreateWorkScheduleDto with existing schedule name
         * Output: BusinessException SCHEDULE_NAME_ALREADY_EXISTS
         */
        it('CWSTC08: Throw error when schedule name already exists', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Existing Schedule',
                schedule_type: ScheduleType.FIXED,
                work_days: '1,2,3,4,5',
                start_time: '08:00:00',
                end_time: '17:00:00',
            };

            const existingSchedule = createMockWorkSchedule({
                schedule_name: dto.schedule_name,
            });

            setupCreateWorkScheduleMocks(mocks, existingSchedule);

            // Act & Assert
            await expect(useCase.execute(dto, MOCK_USER)).rejects.toThrow(BusinessException);

            try {
                await useCase.execute(dto, MOCK_USER);
            } catch (error) {
                expect(error).toBeInstanceOf(BusinessException);
                expect((error as BusinessException).errorCode).toBe(ErrorCodes.SCHEDULE_NAME_ALREADY_EXISTS);
                expect((error as BusinessException).message).toBe('A work schedule with this name already exists.');
                expect((error as BusinessException).statusCode).toBe(409);
            }

            expect(mocks.mockWorkScheduleRepository.findByName).toHaveBeenCalledWith(dto.schedule_name);
            expect(mocks.mockWorkScheduleRepository.save).not.toHaveBeenCalled();
        });

        /**
         * Additional test: Verify created_by and updated_by are set from currentUser
         */
    it('CWSTC08: Set created_by and updated_by from currentUser', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Test Schedule',
                schedule_type: ScheduleType.FLEXIBLE,
            };

            const customUser = { sub: 999, email: 'test@company.com', role: 'HR', permissions: [] };

            setupCreateWorkScheduleMocks(mocks, null);

            // Act
            await useCase.execute(dto, customUser);

            // Assert
            expect(mocks.mockWorkScheduleRepository.save).toHaveBeenCalled();
            const savedSchedule = mocks.mockWorkScheduleRepository.save.mock.calls[0][0];
            const scheduleJson = savedSchedule.toJSON();
            expect(scheduleJson.created_by).toBe(customUser.sub);
            expect(scheduleJson.updated_by).toBe(customUser.sub);
        });

        /**
         * Additional test: Verify status is set to ACTIVE by default
         */
    it('CWSTC09: Set status to ACTIVE by default', async () => {
            // Arrange
            const dto: CreateWorkScheduleDto = {
                schedule_name: 'Test Schedule',
                schedule_type: ScheduleType.FLEXIBLE,
            };

            setupCreateWorkScheduleMocks(mocks, null);

            // Act
            const result = await useCase.execute(dto, MOCK_USER);

            // Assert
            expect(result.data!.status).toBe(ScheduleStatus.ACTIVE);
        });
    });
});

// After all tests finish, export the TEST_CASES metadata to CSV in the test folder.
afterAll(() => {
    try {
        const csvHeader = ['id', 'title', 'preconditions', 'inputSummary', 'expectedOutcome'];
        const escapeCell = (v: any) => {
            if (v === undefined || v === null) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        };

        const lines = [csvHeader.join(',')];
        for (const tc of TEST_CASES) {
            const row = [tc.id, tc.title, tc.preconditions, tc.inputSummary, tc.expectedOutcome]
                .map(escapeCell)
                .join(',');
            lines.push(row);
        }

        const outPath = path.join(__dirname, 'create-work-schedule.test-cases.csv');
        fs.writeFileSync(outPath, lines.join('\n'), { encoding: 'utf8' });
        // eslint-disable-next-line no-console
        console.log(`Wrote test cases CSV: ${outPath}`);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to write test cases CSV', err);
    }
});
