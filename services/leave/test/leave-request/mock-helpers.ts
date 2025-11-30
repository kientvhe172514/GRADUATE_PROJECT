import { ILeaveRecordRepository } from '../../src/application/ports/leave-record.repository.interface';
import { ILeaveTypeRepository } from '../../src/application/ports/leave-type.repository.interface';
import { ILeaveBalanceRepository } from '../../src/application/ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../src/application/ports/leave-balance-transaction.repository.interface';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { ClientProxy } from '@nestjs/microservices';
import { LeaveRecordEntity } from '../../src/domain/entities/leave-record.entity';
import { of } from 'rxjs';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const MOCK_EMPLOYEE_ID = 100;
export const MOCK_EMPLOYEE_CODE = 'EMP001';
export const MOCK_DEPARTMENT_ID = 10;
export const MOCK_LEAVE_TYPE_ID = 1;

export const MOCK_EMPLOYEE_INFO = {
    id: MOCK_EMPLOYEE_ID,
    employee_code: MOCK_EMPLOYEE_CODE,
    department_id: MOCK_DEPARTMENT_ID,
    full_name: 'John Doe',
    email: 'john.doe@company.com',
};

export const MOCK_LEAVE_TYPE = {
    id: MOCK_LEAVE_TYPE_ID,
    leave_type_code: 'ANNUAL',
    leave_type_name: 'Annual Leave',
    deducts_from_balance: true,
    requires_approval: true,
    max_days_per_request: 30,
    is_active: true,
};

export const MOCK_LEAVE_TYPE_NO_DEDUCT = {
    ...MOCK_LEAVE_TYPE,
    deducts_from_balance: false,
};

export const MOCK_LEAVE_BALANCE = {
    id: 1,
    employee_id: MOCK_EMPLOYEE_ID,
    leave_type_id: MOCK_LEAVE_TYPE_ID,
    year: 2025,
    total_days: 15,
    used_days: 3,
    pending_days: 2,
    remaining_days: 10,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
};

/**
 * Create a mock leave record entity with optional overrides
 * @param overrides - Fields to override in the leave record
 * @returns LeaveRecordEntity object with common data merged with overrides
 */
export const createMockLeaveRecord = (overrides = {}): LeaveRecordEntity => {
    return new LeaveRecordEntity({
        id: 1,
        employee_id: MOCK_EMPLOYEE_ID,
        employee_code: MOCK_EMPLOYEE_CODE,
        department_id: MOCK_DEPARTMENT_ID,
        leave_type_id: MOCK_LEAVE_TYPE_ID,
        start_date: new Date('2025-03-10'),
        end_date: new Date('2025-03-12'),
        total_calendar_days: 3,
        total_working_days: 3,
        total_leave_days: 3,
        is_half_day_start: false,
        is_half_day_end: false,
        reason: 'Family emergency',
        supporting_document_url: undefined,
        status: 'PENDING',
        requested_at: new Date('2025-03-01T10:00:00Z'),
        approval_level: 1,
        current_approver_id: undefined,
        metadata: undefined,
        created_at: new Date('2025-03-01T10:00:00Z'),
        updated_at: new Date('2025-03-01T10:00:00Z'),
        ...overrides,
    });
};

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_EMPLOYEE_SERVICE_AVAILABLE = '- Employee service is available';
export const PRECONDITION_EMPLOYEE_EXISTS = `- Employee with ID ${MOCK_EMPLOYEE_ID} EXISTS with employee_code '${MOCK_EMPLOYEE_CODE}'`;
export const PRECONDITION_LEAVE_TYPE_EXISTS = `- Leave type with ID ${MOCK_LEAVE_TYPE_ID} EXISTS`;
export const PRECONDITION_LEAVE_BALANCE_EXISTS = `- Leave balance EXISTS for employee ${MOCK_EMPLOYEE_ID} and leave type ${MOCK_LEAVE_TYPE_ID}`;
export const PRECONDITION_NO_OVERLAPPING_REQUESTS = '- No overlapping leave requests exist';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_CREATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_EMPLOYEE_SERVICE_AVAILABLE}
     * ${PRECONDITION_EMPLOYEE_EXISTS}
     * ${PRECONDITION_LEAVE_TYPE_EXISTS}
     * ${PRECONDITION_LEAVE_BALANCE_EXISTS}
     * ${PRECONDITION_NO_OVERLAPPING_REQUESTS}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockLeaveRecordRepository: jest.Mocked<ILeaveRecordRepository>;
    mockLeaveTypeRepository: jest.Mocked<ILeaveTypeRepository>;
    mockLeaveBalanceRepository: jest.Mocked<ILeaveBalanceRepository>;
    mockTransactionRepository: jest.Mocked<ILeaveBalanceTransactionRepository>;
    mockEventPublisher: jest.Mocked<EventPublisherPort>;
    mockEmployeeService: jest.Mocked<ClientProxy>;
}

/**
 * Setup success mocks for create leave request operation
 * @param mocks - All mocked dependencies
 * @param options - Configuration options for mocks
 */
export const setupCreateLeaveRequestMocks = (
    mocks: MockRepositories,
    options: {
        employeeInfo?: any;
        leaveType?: any;
        leaveBalance?: any;
        overlappingLeaves?: any[];
        createdLeaveRecord?: LeaveRecordEntity;
    } = {}
) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup employee service mock
    const employeeInfo = options.employeeInfo !== undefined ? options.employeeInfo : MOCK_EMPLOYEE_INFO;
    if (employeeInfo) {
        mocks.mockEmployeeService.send.mockReturnValue(of(employeeInfo));
    } else {
        mocks.mockEmployeeService.send.mockReturnValue(of(null));
    }

    // Setup leave type repository mock
    const leaveType = options.leaveType !== undefined ? options.leaveType : MOCK_LEAVE_TYPE;
    mocks.mockLeaveTypeRepository.findById.mockResolvedValue(leaveType);

    // Setup leave record repository mocks
    const overlappingLeaves = options.overlappingLeaves !== undefined ? options.overlappingLeaves : [];
    mocks.mockLeaveRecordRepository.findByDateRange.mockResolvedValue(overlappingLeaves);

    if (options.createdLeaveRecord) {
        mocks.mockLeaveRecordRepository.create.mockResolvedValue(options.createdLeaveRecord);
    } else {
        // Default behavior: return the input as created
        mocks.mockLeaveRecordRepository.create.mockImplementation(async (record) => record);
    }

    // Setup leave balance repository mocks
    const leaveBalance = options.leaveBalance !== undefined ? options.leaveBalance : MOCK_LEAVE_BALANCE;
    mocks.mockLeaveBalanceRepository.findByEmployeeLeaveTypeAndYear.mockResolvedValue(leaveBalance);
    mocks.mockLeaveBalanceRepository.update.mockResolvedValue(undefined);

    // Setup transaction repository mock
    mocks.mockTransactionRepository.create.mockResolvedValue({
        id: 1,
        employee_id: MOCK_EMPLOYEE_ID,
        leave_type_id: MOCK_LEAVE_TYPE_ID,
        year: 2025,
        transaction_type: 'LEAVE_PENDING',
        amount: -3,
        balance_before: 10,
        balance_after: 7,
        reference_type: 'LEAVE_RECORD',
        reference_id: 1,
        description: 'Leave request created (pending approval): Family emergency',
        created_by: MOCK_EMPLOYEE_ID,
        created_at: new Date(),
    } as any);

    // Setup event publisher mock
    mocks.mockEventPublisher.publish.mockImplementation(() => { });
};

/**
 * Expect leave record to be created with correct data
 * @param result - The result object to validate
 * @param expectedData - Expected leave record data
 */
export const expectLeaveRecordCreated = (result: any, expectedData: Partial<LeaveRecordEntity>) => {
    expect(result.id).toBeDefined();
    expect(result.employee_id).toBe(expectedData.employee_id);
    expect(result.employee_code).toBe(expectedData.employee_code);
    expect(result.leave_type_id).toBe(expectedData.leave_type_id);
    expect(result.status).toBe('PENDING');
    expect(result.approval_level).toBe(1);

    if (expectedData.total_calendar_days !== undefined) {
        expect(result.total_calendar_days).toBe(expectedData.total_calendar_days);
    }
    if (expectedData.total_working_days !== undefined) {
        expect(result.total_working_days).toBe(expectedData.total_working_days);
    }
    if (expectedData.total_leave_days !== undefined) {
        expect(result.total_leave_days).toBe(expectedData.total_leave_days);
    }
};

/**
 * Expect leave balance to be updated correctly
 * @param mockRepository - Mocked leave balance repository
 * @param balanceId - Expected balance ID
 * @param expectedPendingDays - Expected new pending days
 * @param expectedRemainingDays - Expected new remaining days
 */
export const expectBalanceUpdated = (
    mockRepository: jest.Mocked<ILeaveBalanceRepository>,
    balanceId: number,
    expectedPendingDays: number,
    expectedRemainingDays: number
) => {
    expect(mockRepository.update).toHaveBeenCalledWith(
        balanceId,
        expect.objectContaining({
            pending_days: expectedPendingDays,
            remaining_days: expectedRemainingDays,
        })
    );
};

/**
 * Expect transaction to be created
 * @param mockRepository - Mocked transaction repository
 * @param transactionType - Expected transaction type
 */
export const expectTransactionCreated = (
    mockRepository: jest.Mocked<ILeaveBalanceTransactionRepository>,
    transactionType: string = 'LEAVE_PENDING'
) => {
    expect(mockRepository.create).toHaveBeenCalled();
    const transactionCall = mockRepository.create.mock.calls[0][0];
    expect(transactionCall.transaction_type).toBe(transactionType);
    expect(transactionCall.reference_type).toBe('LEAVE_RECORD');
};

/**
 * Expect event to be published
 * @param mockPublisher - Mocked event publisher
 * @param eventName - Expected event name
 */
export const expectEventPublished = (
    mockPublisher: jest.Mocked<EventPublisherPort>,
    eventName: string = 'leave.requested'
) => {
    expect(mockPublisher.publish).toHaveBeenCalledWith(
        eventName,
        expect.objectContaining({
            leaveId: expect.any(Number),
            employeeId: expect.any(Number),
            employeeCode: expect.any(String),
        })
    );
};

/**
 * Expect repository methods to be called correctly
 * @param mocks - All mocked repositories
 * @param shouldUpdateBalance - Whether balance should be updated
 */
export const expectRepositoryCalls = (
    mocks: MockRepositories,
    shouldUpdateBalance: boolean = true
) => {
    expect(mocks.mockEmployeeService.send).toHaveBeenCalled();
    expect(mocks.mockLeaveTypeRepository.findById).toHaveBeenCalled();
    expect(mocks.mockLeaveRecordRepository.findByDateRange).toHaveBeenCalled();
    expect(mocks.mockLeaveRecordRepository.create).toHaveBeenCalled();

    if (shouldUpdateBalance) {
        expect(mocks.mockLeaveBalanceRepository.findByEmployeeLeaveTypeAndYear).toHaveBeenCalled();
        expect(mocks.mockLeaveBalanceRepository.update).toHaveBeenCalled();
        expect(mocks.mockTransactionRepository.create).toHaveBeenCalled();
    }

    expect(mocks.mockEventPublisher.publish).toHaveBeenCalled();
};

/**
 * Calculate expected working days (excluding weekends)
 * @param startDate - Start date
 * @param endDate - End date
 * @param isHalfDayStart - Is start date a half day
 * @param isHalfDayEnd - Is end date a half day
 * @returns Expected working days
 */
export const calculateExpectedWorkingDays = (
    startDate: Date,
    endDate: Date,
    isHalfDayStart: boolean = false,
    isHalfDayEnd: boolean = false
): number => {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (isHalfDayStart) workingDays -= 0.5;
    if (isHalfDayEnd) workingDays -= 0.5;

    return workingDays;
};
