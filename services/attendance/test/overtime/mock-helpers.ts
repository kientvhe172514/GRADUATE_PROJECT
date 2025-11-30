import { OvertimeRequestRepository } from '../../src/infrastructure/repositories/overtime-request.repository';
import { JwtPayload } from '@graduate-project/shared-common';
import { OvertimeStatus } from '../../src/application/dtos/overtime-request.dto';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const EXPECTED_SUCCESS_RESPONSE = {
    status: 'SUCCESS',
    statusCode: 200,
    message: 'Overtime request updated successfully',
};

export const MOCK_EMPLOYEE_ID = 100;
export const MOCK_OTHER_EMPLOYEE_ID = 200;

export const MOCK_USER: JwtPayload = {
    sub: 1,
    email: 'employee@company.com',
    role: 'EMPLOYEE',
    employee_id: MOCK_EMPLOYEE_ID,
    permissions: [],
};

export const MOCK_OTHER_USER: JwtPayload = {
    sub: 2,
    email: 'other@company.com',
    role: 'EMPLOYEE',
    employee_id: MOCK_OTHER_EMPLOYEE_ID,
    permissions: [],
};

/**
 * Create a mock overtime request with optional overrides
 * @param overrides - Fields to override in the overtime request
 * @returns Overtime request object with common data merged with overrides
 */
export const createMockOvertimeRequest = (overrides = {}) => ({
    id: 1,
    employee_id: MOCK_EMPLOYEE_ID,
    employee_code: 'EMP001',
    department_id: 10,
    overtime_date: new Date('2025-01-15'),
    start_time: new Date('2025-01-15T18:00:00Z'),
    end_time: new Date('2025-01-15T21:00:00Z'),
    estimated_hours: 3.0,
    actual_hours: null,
    reason: 'Urgent project deadline',
    status: OvertimeStatus.PENDING,
    requested_by: 1,
    requested_at: new Date('2025-01-10T10:00:00Z'),
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejection_reason: null,
    created_at: new Date('2025-01-10T10:00:00Z'),
    updated_at: new Date('2025-01-10T10:00:00Z'),
    ...overrides,
});

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_OVERTIME_REQUEST_EXISTS = '- Overtime request with ID 1 EXISTS with status PENDING';
export const PRECONDITION_OVERTIME_REQUEST_BELONGS_TO_USER = '- Overtime request with ID 1 has employee_id = 100';
export const PRECONDITION_USER_IS_OWNER = '- Current user has employee_id = 100';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_UPDATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_OVERTIME_REQUEST_EXISTS}
     * ${PRECONDITION_OVERTIME_REQUEST_BELONGS_TO_USER}
     * ${PRECONDITION_USER_IS_OWNER}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockOvertimeRepo: jest.Mocked<OvertimeRequestRepository>;
}

/**
 * Setup success mocks for update overtime request operation
 * @param mocks - All mocked dependencies
 * @param existingRequest - Existing overtime request to be returned by findOne
 * @param updatedRequest - Updated overtime request to be returned by updateRequest
 */
export const setupUpdateOvertimeMocks = (
    mocks: MockRepositories,
    existingRequest: any = null,
    updatedRequest: any = null
) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup repository mocks
    const request = existingRequest !== undefined ? existingRequest : createMockOvertimeRequest();
    mocks.mockOvertimeRepo.findOne.mockResolvedValue(request);

    if (updatedRequest) {
        mocks.mockOvertimeRepo.updateRequest.mockResolvedValue(updatedRequest);
    } else if (request) {
        // Default behavior: return the request with updates applied
        mocks.mockOvertimeRepo.updateRequest.mockImplementation(async (id, updateData) => ({
            ...request,
            ...updateData,
            updated_at: new Date(),
        }));
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
 * Expect overtime request data in response
 * @param overtimeData - Overtime data object to validate
 * @param expectedData - Expected overtime data
 */
export const expectOvertimeData = (overtimeData: any, expectedData: Partial<any>) => {
    expect(overtimeData.id).toBeDefined();
    expect(overtimeData.employee_id).toBe(expectedData.employee_id || MOCK_EMPLOYEE_ID);
    expect(overtimeData.status).toBe(OvertimeStatus.PENDING);

    if (expectedData.start_time !== undefined) {
        expect(overtimeData.start_time).toBeDefined();
    }
    if (expectedData.end_time !== undefined) {
        expect(overtimeData.end_time).toBeDefined();
    }
    if (expectedData.estimated_hours !== undefined) {
        expect(overtimeData.estimated_hours).toBe(expectedData.estimated_hours);
    }
    if (expectedData.reason !== undefined) {
        expect(overtimeData.reason).toBe(expectedData.reason);
    }
};

/**
 * Expect repository methods to be called correctly
 * @param mockRepository - Mocked overtime repository
 * @param overtimeId - Expected overtime request ID
 */
export const expectRepositoryCalls = (
    mockRepository: jest.Mocked<OvertimeRequestRepository>,
    overtimeId: number
) => {
    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: overtimeId } });
    expect(mockRepository.updateRequest).toHaveBeenCalled();
};

/**
 * Expect update data to be formatted correctly
 * @param mockRepository - Mocked overtime repository
 * @param expectedFields - Expected fields in update data
 */
export const expectUpdateDataFormat = (
    mockRepository: jest.Mocked<OvertimeRequestRepository>,
    expectedFields: string[]
) => {
    expect(mockRepository.updateRequest).toHaveBeenCalled();
    const updateCall = mockRepository.updateRequest.mock.calls[0];
    const updateData = updateCall[1];

    expectedFields.forEach((field) => {
        expect(updateData).toHaveProperty(field);
    });

    // Check that date strings are converted to Date objects
    if (updateData.start_time !== undefined && updateData.start_time !== null) {
        expect(updateData.start_time).toBeInstanceOf(Date);
    }
    if (updateData.end_time !== undefined && updateData.end_time !== null) {
        expect(updateData.end_time).toBeInstanceOf(Date);
    }
};
