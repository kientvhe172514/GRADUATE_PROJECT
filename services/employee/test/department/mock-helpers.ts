import { DepartmentRepositoryPort } from '../../src/application/ports/department.repository.port';
import { EventPublisherPort } from '../../src/application/ports/event.publisher.port';
import { Department } from '../../src/domain/entities/department.entity';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================
export const COMMON_INPUT = {
  department_code: 'IT-001',
  department_name: 'Information Technology',
  description: 'IT Department',
  parent_department_id: undefined,
  manager_id: undefined,
  office_address: 'Floor 3, Building A',
  office_latitude: 10.123456,
  office_longitude: 106.789012,
  office_radius_meters: 100,
};

export const COMMON_SAVED_DEPARTMENT_DATA = {
  id: 1,
  department_code: 'IT-001',
  department_name: 'Information Technology',
  description: 'IT Department',
  level: 1,
  office_address: 'Floor 3, Building A',
  office_latitude: 10.123456,
  office_longitude: 106.789012,
  office_radius_meters: 100,
  status: 'ACTIVE' as const,
  created_at: new Date('2025-11-09T10:00:00Z'),
  updated_at: new Date('2025-11-09T10:00:00Z'),
};

export const EXPECTED_SUCCESS_RESPONSE = {
  status: 'SUCCESS',
  statusCode: 201,
  message: 'Department created successfully',
};

/**
 * Create a common saved department with optional overrides
 * @param overrides - Fields to override in the saved department
 * @returns Department object with common data merged with overrides
 */
export const createCommonSavedDepartment = (overrides = {}): Department => 
  new Department({
    ...COMMON_SAVED_DEPARTMENT_DATA,
    ...overrides,
  });

// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_DEPARTMENT_CODE_NOT_EXISTS = "- department_code 'IT-001' does NOT exist";
export const PRECONDITION_DEPARTMENT_CODE_EXISTS = "- department_code 'IT-001' ALREADY EXISTS";
export const PRECONDITION_EVENT_SERVICE_AVAILABLE = '- Event publishing service available';
export const PRECONDITION_PARENT_DEPARTMENT_EXISTS = '- parent_department_id exists';
export const PRECONDITION_MANAGER_EXISTS = '- manager_id exists';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_CREATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_DEPARTMENT_CODE_NOT_EXISTS}`;

export const PRECONDITIONS_DUPLICATE_CODE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_DEPARTMENT_CODE_EXISTS}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================

/**
 * Setup success mocks for repository operations
 * @param mockDepartmentRepository - Mocked department repository
 * @param mockEventPublisher - Mocked event publisher
 * @param savedDepartment - Department to be returned by create mock
 */
export const setupMocks = (
  mockDepartmentRepository: jest.Mocked<DepartmentRepositoryPort>,
  mockEventPublisher: jest.Mocked<EventPublisherPort>,
  savedDepartment: Department
) => {
  // Clear previous mocks
  jest.clearAllMocks();

  // Setup department repository mocks
  mockDepartmentRepository.findByCode.mockResolvedValue(null);
  mockDepartmentRepository.create.mockResolvedValue(savedDepartment);

  // Setup event publisher mock
  mockEventPublisher.publish.mockImplementation(() => {});
};

/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 */
export const expectSuccessResponse = (result: any) => {
  expect(result.status).toBe(EXPECTED_SUCCESS_RESPONSE.status);
  expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
  expect(result.message).toBe(EXPECTED_SUCCESS_RESPONSE.message);
};
