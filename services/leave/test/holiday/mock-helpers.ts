import { IHolidayRepository } from '../../src/application/ports/holiday.repository.interface';
import { HolidayEntity } from '../../src/domain/entities/holiday.entity';
import { HolidayType, HolidayAppliesTo, HolidayStatus } from '../../src/application/holiday/dto/holiday.dto';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================

export const MOCK_HOLIDAY_DATE = '2025-01-29';

/**
 * Create a mock holiday entity with optional overrides
 * @param overrides - Fields to override in the holiday
 * @returns HolidayEntity object with common data merged with overrides
 */
export const createMockHoliday = (overrides = {}): HolidayEntity => {
    return new HolidayEntity({
        id: 1,
        holiday_name: 'Lunar New Year',
        holiday_date: new Date(MOCK_HOLIDAY_DATE),
        holiday_type: HolidayType.PUBLIC_HOLIDAY,
        applies_to: HolidayAppliesTo.ALL,
        department_ids: undefined,
        location_ids: undefined,
        is_recurring: false,
        recurring_month: undefined,
        recurring_day: undefined,
        recurring_rule: undefined,
        is_mandatory: true,
        is_paid: true,
        can_work_for_ot: false,
        description: 'National holiday celebrating Lunar New Year',
        year: 2025,
        status: HolidayStatus.ACTIVE,
        created_at: new Date('2025-01-01T10:00:00Z'),
        updated_at: new Date('2025-01-01T10:00:00Z'),
        ...overrides,
    });
};

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_NO_DUPLICATE_HOLIDAY = `- No holiday exists on ${MOCK_HOLIDAY_DATE} with type PUBLIC_HOLIDAY`;
export const PRECONDITION_DUPLICATE_HOLIDAY_EXISTS = `- Holiday exists on ${MOCK_HOLIDAY_DATE} with type PUBLIC_HOLIDAY`;

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_CREATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_NO_DUPLICATE_HOLIDAY}`;

export const PRECONDITIONS_DUPLICATE_EXISTS = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_DUPLICATE_HOLIDAY_EXISTS}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

export interface MockRepositories {
    mockHolidayRepository: jest.Mocked<IHolidayRepository>;
}

/**
 * Setup success mocks for create holiday operation
 * @param mocks - All mocked dependencies
 * @param existingHolidays - Existing holidays to be returned by findByDateRange
 * @param createdHoliday - Created holiday to be returned by create
 */
export const setupCreateHolidayMocks = (
    mocks: MockRepositories,
    existingHolidays: HolidayEntity[] = [],
    createdHoliday?: HolidayEntity
) => {
    // Clear previous mocks
    jest.clearAllMocks();

    // Setup repository mocks
    mocks.mockHolidayRepository.findByDateRange.mockResolvedValue(existingHolidays);

    if (createdHoliday) {
        mocks.mockHolidayRepository.create.mockResolvedValue(createdHoliday);
    } else {
        // Default behavior: return the input as created
        mocks.mockHolidayRepository.create.mockImplementation(async (holiday) => createMockHoliday(holiday));
    }
};

/**
 * Expect holiday to be created with correct data
 * @param result - The result object to validate
 * @param expectedData - Expected holiday data
 */
export const expectHolidayCreated = (result: any, expectedData: Partial<HolidayEntity>) => {
    expect(result.id).toBeDefined();
    expect(result.holiday_name).toBe(expectedData.holiday_name);
    expect(result.holiday_type).toBe(expectedData.holiday_type);
    expect(result.applies_to).toBe(expectedData.applies_to);
    expect(result.is_recurring).toBe(expectedData.is_recurring);
    expect(result.is_mandatory).toBe(expectedData.is_mandatory);
    expect(result.is_paid).toBe(expectedData.is_paid);
    expect(result.can_work_for_ot).toBe(expectedData.can_work_for_ot);
    expect(result.year).toBe(expectedData.year);
    expect(result.status).toBe(HolidayStatus.ACTIVE);

    if (expectedData.description !== undefined) {
        expect(result.description).toBe(expectedData.description);
    }
};

/**
 * Expect repository methods to be called correctly
 * @param mockRepository - Mocked holiday repository
 * @param holidayDate - Expected holiday date
 */
export const expectRepositoryCalls = (
    mockRepository: jest.Mocked<IHolidayRepository>,
    holidayDate: string
) => {
    expect(mockRepository.findByDateRange).toHaveBeenCalled();

    // Verify date range parameters (start of day to end of day)
    const findCall = mockRepository.findByDateRange.mock.calls[0];
    const startDate = findCall[0];
    const endDate = findCall[1];

    expect(startDate.getHours()).toBe(0);
    expect(startDate.getMinutes()).toBe(0);
    expect(startDate.getSeconds()).toBe(0);
    expect(startDate.getMilliseconds()).toBe(0);

    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
    expect(endDate.getMilliseconds()).toBe(999);

    expect(mockRepository.create).toHaveBeenCalled();
};

/**
 * Expect holiday entity to be created with correct properties
 * @param mockRepository - Mocked holiday repository
 * @param expectedStatus - Expected status (default: ACTIVE)
 */
export const expectHolidayEntityFormat = (
    mockRepository: jest.Mocked<IHolidayRepository>,
    expectedStatus: string = HolidayStatus.ACTIVE
) => {
    expect(mockRepository.create).toHaveBeenCalled();
    const createCall = mockRepository.create.mock.calls[0][0];

    expect(createCall).toBeInstanceOf(HolidayEntity);
    expect(createCall.status).toBe(expectedStatus);
    expect(createCall.holiday_date).toBeInstanceOf(Date);
};

/**
 * Expect duplicate check to be performed
 * @param mockRepository - Mocked holiday repository
 * @param shouldFindDuplicate - Whether duplicate should be found
 */
export const expectDuplicateCheck = (
    mockRepository: jest.Mocked<IHolidayRepository>,
    shouldFindDuplicate: boolean = false
) => {
    expect(mockRepository.findByDateRange).toHaveBeenCalled();

    if (shouldFindDuplicate) {
        expect(mockRepository.create).not.toHaveBeenCalled();
    } else {
        expect(mockRepository.create).toHaveBeenCalled();
    }
};
