export enum AccountType {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN', 
  MANAGER = 'MANAGER'
}

/**
 * System Roles with Hierarchy Levels
 * 
 * Level 1: ADMIN (Highest) - System administrator, full access
 * Level 2: HR_MANAGER - HR department management
 * Level 3: DEPARTMENT_MANAGER - Department-level management
 * Level 4: EMPLOYEE (Lowest) - Regular employee
 * 
 * Lower level number = Higher privileges
 */
export enum AccountRole {
  ADMIN = 'ADMIN',                           // Level 1
  HR_MANAGER = 'HR_MANAGER',                 // Level 2
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER', // Level 3
  EMPLOYEE = 'EMPLOYEE'                      // Level 4
}

/**
 * Role Level Mapping
 * Used for hierarchy validation
 */
export const ROLE_LEVELS: Record<AccountRole, number> = {
  [AccountRole.ADMIN]: 1,
  [AccountRole.HR_MANAGER]: 2,
  [AccountRole.DEPARTMENT_MANAGER]: 3,
  [AccountRole.EMPLOYEE]: 4,
};