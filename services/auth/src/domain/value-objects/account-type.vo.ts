export enum AccountType {
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN', 
  MANAGER = 'MANAGER'
}

/**
 * Account Roles - Must match roles in database (roles table)
 * Only 4 roles are allowed: ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
 */
export enum AccountRole {
  ADMIN = 'ADMIN',
  HR_MANAGER = 'HR_MANAGER',
  DEPARTMENT_MANAGER = 'DEPARTMENT_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}