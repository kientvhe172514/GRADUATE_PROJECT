import { EmployeeShiftRepository } from '../../src/infrastructure/repositories/employee-shift.repository';
import { AttendanceEditLogRepository } from '../../src/infrastructure/repositories/attendance-edit-log.repository';
import { JwtPayload } from '@graduate-project/shared-common';
import { ShiftStatus } from '../../src/domain/entities/employee-shift.entity';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const EXPECTED_SUCCESS_RESPONSE = {
    status: 'SUCCESS',
    statusCode: 200,
    message: 'Shift manually edited successfully.',
};

export const EXPECTED_NO_CHANGE_RESPONSE = {
    status: 'SUCCESS',
    statusCode: 200,
    message: 'No changes applied.',
};

export const MOCK_EMPLOYEE_ID = 100;
export const MOCK_EMPLOYEE_CODE = 'EMP001';
export const MOCK_DEPARTMENT_ID = 10;
export const MOCK_IP_ADDRESS = '192.168.1.100';

export const MOCK_USER: JwtPayload = {
    sub: 1,
    email: 'hr@company.com',
    role: 'HR',
    employee_id: MOCK_EMPLOYEE_ID,
    permissions: [],
};

/**
 * Create a mock employee shift with optional overrides
 * @param overrides - Fields to override in the shift
 * @returns Employee shift object with common data merged with overrides
 */
export const createMockEmployeeShift = (overrides = {}) => ({
    id: 1,
    employee_id: MOCK_EMPLOYEE_ID,
    employee_code: MOCK_EMPLOYEE_CODE,
    department_id: MOCK_DEPARTMENT_ID,
    shift_date: new Date('2025-01-01'),
    work_schedule_id: 1,
    scheduled_start_time: new Date('2025-01-01T08:00:00.000Z'),
    scheduled_end_time: new Date('2025-01-01T17:00:00.000Z'),
    check_in_time: new Date('2025-01-01T08:00:00.000Z'),
    check_out_time: new Date('2025-01-01T17:00:00.000Z'),
    work_hours: 8.0,
    overtime_hours: 0,
    break_hours: 1.0,
    late_minutes: 0,
    early_leave_minutes: 0,
    status: ShiftStatus.IN_PROGRESS,
    notes: null,
    is_manually_edited: false,
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    created_by: 1,
    updated_at: new Date('2025-01-01T00:00:00.000Z'),
    updated_by: 1,
    ...overrides,
});

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_SHIFT_EXISTS = '- Employee shift with ID 1 EXISTS';
export const PRECONDITION_USER_AUTHENTICATED = '- Current user is authenticated (HR role)';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_EDIT = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_SHIFT_EXISTS}
     * ${PRECONDITION_USER_AUTHENTICATED}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockEmployeeShiftRepo: jest.Mocked<EmployeeShiftRepository>;
    mockAttendanceEditLogRepo: jest.Mocked<AttendanceEditLogRepository>;
}

/**
 * Setup success mocks for manual edit shift operation
 * @param mocks - All mocked dependencies
 * @param existingShift - Existing shift to be returned by findById
 * @param updatedShift - Updated shift to be returned by findById after update
 */
export const setupManualEditShiftMocks = (
    mocks: MockRepositories,
    existingShift: any = null,
    updatedShift: any = null
) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup repository mocks
    const shift = existingShift !== undefined ? existingShift : createMockEmployeeShift();
    const updated = updatedShift !== undefined ? updatedShift : {
        ...shift,
        is_manually_edited: true,
        updated_by: MOCK_USER.sub,
        updated_at: new Date(),
    };

    if (shift) {
        // First call returns existing shift
        mocks.mockEmployeeShiftRepo.findById.mockResolvedValueOnce(shift);

        // Second call (after update) returns updated shift
        mocks.mockEmployeeShiftRepo.findById.mockResolvedValueOnce(updated);
    } else {
        mocks.mockEmployeeShiftRepo.findById.mockResolvedValue(null);
    }

    // repository update resolves with the updated shift object
    mocks.mockEmployeeShiftRepo.update.mockResolvedValue(updated as any);
    mocks.mockAttendanceEditLogRepo.createLog.mockResolvedValue({
        id: 1,
        shift_id: 1,
        employee_id: MOCK_EMPLOYEE_ID,
        employee_code: MOCK_EMPLOYEE_CODE,
        shift_date: new Date('2025-01-01'),
        edited_by_user_id: MOCK_USER.sub,
        edited_by_user_name: MOCK_USER.email,
        edited_by_role: MOCK_USER.role,
        field_changed: 'check_in_time',
        old_value: '2025-01-01T08:00:00.000Z',
        new_value: '2025-01-01T08:30:00.000Z',
        edit_reason: 'Employee forgot to check-in',
        ip_address: MOCK_IP_ADDRESS,
        created_at: new Date(),
    } as any);
};

/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 * @param expectChanges - Whether changes were applied
 */
export const expectSuccessResponse = (result: any, expectChanges: boolean = true) => {
    expect(result.status).toBe('SUCCESS');
    expect(result.statusCode).toBe(200);

    if (expectChanges) {
        expect(result.message).toBe(EXPECTED_SUCCESS_RESPONSE.message);
    } else {
        expect(result.message).toBe(EXPECTED_NO_CHANGE_RESPONSE.message);
    }

    expect(result.data).toBeDefined();
};

/**
 * Expect shift data in response
 * @param shiftData - Shift data object to validate
 * @param expectedData - Expected shift data
 */
export const expectShiftData = (shiftData: any, expectedData: Partial<any>) => {
    expect(shiftData.id).toBeDefined();
    expect(shiftData.employee_id).toBe(expectedData.employee_id || MOCK_EMPLOYEE_ID);

    if (expectedData.check_in_time !== undefined) {
        expect(shiftData.check_in_time).toBeDefined();
    }
    if (expectedData.check_out_time !== undefined) {
        expect(shiftData.check_out_time).toBeDefined();
    }
    if (expectedData.status !== undefined) {
        expect(shiftData.status).toBe(expectedData.status);
    }
    if (expectedData.notes !== undefined) {
        expect(shiftData.notes).toBe(expectedData.notes);
    }
    if (expectedData.is_manually_edited !== undefined) {
        expect(shiftData.is_manually_edited).toBe(expectedData.is_manually_edited);
    }
    if (expectedData.updated_by !== undefined) {
        expect(shiftData.updated_by).toBe(expectedData.updated_by);
    }
};

/**
 * Expect repository methods to be called correctly
 * @param mocks - All mocked repositories
 * @param shiftId - Expected shift ID
 * @param shouldUpdate - Whether update should be called
 */
export const expectRepositoryCalls = (
    mocks: MockRepositories,
    shiftId: number,
    shouldUpdate: boolean = true
) => {
    expect(mocks.mockEmployeeShiftRepo.findById).toHaveBeenCalledWith(shiftId);

    if (shouldUpdate) {
        expect(mocks.mockEmployeeShiftRepo.update).toHaveBeenCalled();
        expect(mocks.mockEmployeeShiftRepo.findById).toHaveBeenCalledTimes(2); // Before and after update
    } else {
        expect(mocks.mockEmployeeShiftRepo.update).not.toHaveBeenCalled();
        expect(mocks.mockEmployeeShiftRepo.findById).toHaveBeenCalledTimes(1); // Only initial call
    }
};

/**
 * Expect edit logs to be created
 * @param mockRepo - Mocked attendance edit log repository
 * @param expectedLogCount - Expected number of logs created
 */
export const expectEditLogsCreated = (
    mockRepo: jest.Mocked<AttendanceEditLogRepository>,
    expectedLogCount: number
) => {
    expect(mockRepo.createLog).toHaveBeenCalledTimes(expectedLogCount);

    if (expectedLogCount > 0) {
        const logCalls = mockRepo.createLog.mock.calls;
        logCalls.forEach((call) => {
            const logData = call[0];
            expect(logData.edited_by_user_id).toBe(MOCK_USER.sub);
            expect(logData.edited_by_user_name).toBe(MOCK_USER.email);
            expect(logData.edited_by_role).toBe(MOCK_USER.role);
            expect(logData.edit_reason).toBeDefined();
            expect(logData.ip_address).toBe(MOCK_IP_ADDRESS);
            expect(logData.field_changed).toBeDefined();
        });
    }
};

/**
 * Expect update data to be formatted correctly
 * @param mockRepo - Mocked employee shift repository
 * @param expectedFields - Expected fields in update data
 */
export const expectUpdateDataFormat = (
    mockRepo: jest.Mocked<EmployeeShiftRepository>,
    expectedFields: string[]
) => {
    expect(mockRepo.update).toHaveBeenCalled();
    const updateCall = mockRepo.update.mock.calls[0];
    const updateData: any = updateCall[1];

    // Always expect these fields in updates
    expect(updateData.is_manually_edited).toBe(true);
    expect(updateData.updated_by).toBe(MOCK_USER.sub);
    expect(updateData.updated_at).toBeInstanceOf(Date);

    // Check expected fields
    expectedFields.forEach((field) => {
        expect(updateData).toHaveProperty(field);
    });

    // Check that date strings are converted to Date objects
    if (updateData.check_in_time !== undefined) {
        expect(updateData.check_in_time).toBeInstanceOf(Date);
    }
    if (updateData.check_out_time !== undefined) {
        expect(updateData.check_out_time).toBeInstanceOf(Date);
    }
};
