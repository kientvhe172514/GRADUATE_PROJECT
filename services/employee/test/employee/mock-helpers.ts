import { Employee } from '../../src/domain/entities/employee.entity';

// ============================================================================
// COMMON TEST DATA - Reusable across test cases
// ============================================================================
export const COMMON_INPUT = {
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01',
  gender: 'MALE' as const,
  hire_date: '2025-10-07',
  employment_type: 'FULL_TIME' as const,
  phone_number: '   ',
  department_id: 1,
  position_id: 1,
  manager_id: 2,
};

export const COMMON_POSITION = {
  id: 1,
  position_code: 'POS001',
  position_name: 'Software Engineer',
  level: 2,
  suggested_role: 'EMPLOYEE' as const,
  currency: 'VND' as const,
  status: 'ACTIVE' as const,
};

export const EXPECTED_SUCCESS_RESPONSE = {
  status: 'SUCCESS',
  statusCode: 201,
  message: 'Employee created',
  errorCode: 'EMPLOYEE_CREATED',
};

/**
 * Create a common saved employee with optional overrides
 * @param overrides - Fields to override in the saved employee
 * @returns Employee object with default data merged with overrides
 */
export const createCommonSavedEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 1,
  account_id: 100,
  status: 'ACTIVE' as const,
  onboarding_status: 'PENDING' as const,
  profile_completion_percentage: 0,
  created_at: new Date('2025-11-09T10:00:00Z'),
  updated_at: new Date('2025-11-09T10:00:00Z'),

  // Employee-specific fields
  employee_code: 'EMP001',
  first_name: 'John',
  last_name: 'Doe',
  full_name: 'John Doe',
  date_of_birth: new Date('1990-01-01'),
  gender: 'MALE' as const,
  email: 'john.doe@company.com',
  phone_number: '   ',
  department_id: 1,
  position_id: 1,
  manager_id: 2,
  hire_date: new Date('2025-10-07'),
  employment_type: 'FULL_TIME' as const,

  ...overrides, // cho phép test override bất cứ field nào
});


// ============================================================================
// COMMON PRECONDITIONS - Reusable precondition descriptions
// ============================================================================
export const PRECONDITION_DATABASE_CONNECTED = '- Can connect to database';
export const PRECONDITION_EMPLOYEE_CODE_NOT_EXISTS = "- employee_code 'EMP001' does NOT exist";
export const PRECONDITION_EMAIL_NOT_EXISTS = "- email 'john.doe@company.com' does NOT exist";
export const PRECONDITION_EMPLOYEE_CODE_EXISTS = "- employee_code 'EMP001' ALREADY EXISTS";
export const PRECONDITION_EMAIL_EXISTS = "- email 'john.doe@company.com' ALREADY EXISTS";
export const PRECONDITION_POSITION_EXISTS_WITH_ROLE = "- position_id 1 exists with suggested_role 'EMPLOYEE'";
export const PRECONDITION_POSITION_EXISTS_NO_ROLE = '- position_id 1 exists but NO suggested_role field';
export const PRECONDITION_EVENT_SERVICE_AVAILABLE = '- Event publishing service available';
export const PRECONDITION_EMPLOYEE_NOT_LINKED = '- Employee NOT yet linked to account';

// Commonly used precondition combinations
export const PRECONDITIONS_BASIC_CREATE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_EMPLOYEE_CODE_NOT_EXISTS}
     * ${PRECONDITION_EMAIL_NOT_EXISTS}`;

export const PRECONDITIONS_CREATE_WITH_POSITION = `${PRECONDITIONS_BASIC_CREATE}
     * ${PRECONDITION_POSITION_EXISTS_WITH_ROLE}`;

export const PRECONDITIONS_DUPLICATE_CODE = `${PRECONDITION_DATABASE_CONNECTED}
     * ${PRECONDITION_EMPLOYEE_CODE_EXISTS}`;

export const PRECONDITIONS_DUPLICATE_EMAIL = `${PRECONDITIONS_BASIC_CREATE.replace(PRECONDITION_EMAIL_NOT_EXISTS, PRECONDITION_EMAIL_EXISTS)}`;

// ============================================================================
// MOCK HELPERS - Setup and validation functions
// ============================================================================


/**
 * Expect success response with standard fields
 * @param result - The result object to validate
 */
export const expectSuccessResponse = (result: any) => {
  expect(result.status).toBe(EXPECTED_SUCCESS_RESPONSE.status);
  expect(result.statusCode).toBe(EXPECTED_SUCCESS_RESPONSE.statusCode);
  expect(result.message).toBe(EXPECTED_SUCCESS_RESPONSE.message);
  expect(result.errorCode).toBe(EXPECTED_SUCCESS_RESPONSE.errorCode);
};
