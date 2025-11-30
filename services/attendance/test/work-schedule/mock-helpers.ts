import { IWorkScheduleRepository } from '../../src/application/ports/work-schedule.repository.port';
import { WorkSchedule, ScheduleType, ScheduleStatus } from '../../src/domain/entities/work-schedule.entity';
import { JwtPayload } from '@graduate-project/shared-common';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const EXPECTED_SUCCESS_RESPONSE = {
    status: 'SUCCESS',
    statusCode: 201,
    message: 'Work schedule created successfully.',
};

export const MOCK_USER: JwtPayload = {
    sub: 1,
    email: 'admin@company.com',
    role: 'ADMIN',
    permissions: [],
};

/**
 * Create a mock work schedule entity with optional overrides
 * @param overrides - Fields to override in the work schedule
 * @returns WorkSchedule object with common data merged with overrides
 */
export const createMockWorkSchedule = (overrides = {}): WorkSchedule => {
    const defaultProps = {
        id: 1,
        schedule_name: 'Standard Office Hours',
        schedule_type: ScheduleType.FIXED,
        work_days: '1,2,3,4,5',
        start_time: '08:00:00',
        end_time: '17:00:00',
        break_duration_minutes: 60,
        late_tolerance_minutes: 15,
        early_leave_tolerance_minutes: 15,
        status: ScheduleStatus.ACTIVE,
        created_by: MOCK_USER.sub,
        updated_by: MOCK_USER.sub,
        created_at: new Date('2025-01-01T10:00:00Z'),
        updated_at: new Date('2025-01-01T10:00:00Z'),
        ...overrides,
    };

    return new WorkSchedule(defaultProps);
};

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_SCHEDULE_NAME_NOT_EXISTS = "- Work schedule with name 'Standard Office Hours' does NOT exist";
export const PRECONDITION_SCHEDULE_NAME_EXISTS = "- Work schedule with name 'Existing Schedule' ALREADY exists";
export const PRECONDITION_USER_AUTHENTICATED = '- Current user is authenticated';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_CREATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_SCHEDULE_NAME_NOT_EXISTS}
     * ${PRECONDITION_USER_AUTHENTICATED}`;

export const PRECONDITIONS_DUPLICATE_NAME = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_SCHEDULE_NAME_EXISTS}
     * ${PRECONDITION_USER_AUTHENTICATED}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockWorkScheduleRepository: jest.Mocked<IWorkScheduleRepository>;
}

/**
 * Setup success mocks for create work schedule operation
 * @param mocks - All mocked dependencies
 * @param existingSchedule - Existing schedule to be returned by findByName (null if not exists)
 * @param savedSchedule - Saved schedule to be returned by save
 */
export const setupCreateWorkScheduleMocks = (
    mocks: MockRepositories,
    existingSchedule: WorkSchedule | null = null,
    savedSchedule?: WorkSchedule
) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup repository mocks
    mocks.mockWorkScheduleRepository.findByName.mockResolvedValue(existingSchedule);

    if (savedSchedule) {
        mocks.mockWorkScheduleRepository.save.mockResolvedValue(savedSchedule);
    } else {
        // Default behavior: return the input as saved
        mocks.mockWorkScheduleRepository.save.mockImplementation(async (schedule) => schedule);
    }
};

/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 */
export const expectSuccessResponse = (result: any) => {
    expect(result.status).toBe(EXPECTED_SUCCESS_RESPONSE.status);
    expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
    expect(result.message).toBe(EXPECTED_SUCCESS_RESPONSE.message);
    expect(result.data).toBeDefined();
};

/**
 * Expect work schedule data in response
 * @param scheduleData - Schedule data object to validate
 * @param expectedSchedule - Expected schedule data
 */
export const expectWorkScheduleData = (scheduleData: any, expectedSchedule: Partial<WorkSchedule>) => {
    expect(scheduleData.id).toBeDefined();
    expect(scheduleData.schedule_name).toBe(expectedSchedule.schedule_name);
    expect(scheduleData.schedule_type).toBe(expectedSchedule.schedule_type);

    if (expectedSchedule.schedule_type === ScheduleType.FIXED) {
        expect(scheduleData.work_days).toBe(expectedSchedule.work_days);
        expect(scheduleData.start_time).toBe(expectedSchedule.start_time);
        expect(scheduleData.end_time).toBe(expectedSchedule.end_time);
    }

    expect(scheduleData.break_duration_minutes).toBeDefined();
    expect(scheduleData.late_tolerance_minutes).toBeDefined();
    expect(scheduleData.early_leave_tolerance_minutes).toBeDefined();
    expect(scheduleData.status).toBe(ScheduleStatus.ACTIVE);
};

/**
 * Expect repository methods to be called correctly
 * @param mockRepository - Mocked work schedule repository
 * @param scheduleName - Expected schedule name to check
 */
export const expectRepositoryCalls = (
    mockRepository: jest.Mocked<IWorkScheduleRepository>,
    scheduleName: string
) => {
    expect(mockRepository.findByName).toHaveBeenCalledWith(scheduleName);
    expect(mockRepository.save).toHaveBeenCalled();
};

/**
 * Expect WorkSchedule entity to be created with correct user tracking
 * @param mockRepository - Mocked work schedule repository
 * @param userId - Expected user ID
 */
export const expectUserTracking = (
    mockRepository: jest.Mocked<IWorkScheduleRepository>,
    userId: number
) => {
    expect(mockRepository.save).toHaveBeenCalled();
    const savedSchedule = mockRepository.save.mock.calls[0][0];
    const scheduleJson = savedSchedule.toJSON();
    expect(scheduleJson.created_by).toBe(userId);
    expect(scheduleJson.updated_by).toBe(userId);
};

/**
 * Expect default values to be set correctly
 * @param scheduleData - Schedule data to validate
 */
export const expectDefaultValues = (scheduleData: any) => {
    expect(scheduleData.break_duration_minutes).toBe(60);
    expect(scheduleData.late_tolerance_minutes).toBe(15);
    expect(scheduleData.early_leave_tolerance_minutes).toBe(15);
    expect(scheduleData.status).toBe(ScheduleStatus.ACTIVE);
};
