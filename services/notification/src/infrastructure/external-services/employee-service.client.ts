import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmployeeInfo {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  department_id?: number;
  role?: string;
}

@Injectable()
export class EmployeeServiceClient {
  private readonly logger = new Logger(EmployeeServiceClient.name);
  private readonly employeeServiceUrl: string;
  private readonly authServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.employeeServiceUrl = this.configService.get<string>(
      'EMPLOYEE_SERVICE_URL',
      'http://localhost:3002',
    );
    this.authServiceUrl = this.configService.get<string>(
      'AUTH_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  /**
   * Get managers (HR_MANAGER or DEPARTMENT_MANAGER) for a department
   * @param departmentId Department ID
   * @returns Array of manager employee IDs
   */
  async getManagersForDepartment(departmentId: number): Promise<number[]> {
    try {
      // Step 1: Get all employees in the department
      const employeesUrl = `${this.employeeServiceUrl}/employees`;
      const employeesParams = {
        department_id: departmentId,
        limit: 1000, // Get all employees in department
      };

      this.logger.log(`Fetching employees for department ${departmentId}`);
      const queryParams = new URLSearchParams(
        Object.entries(employeesParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>),
      );
      const urlWithParams = `${employeesUrl}?${queryParams.toString()}`;
      
      const employeesResponse = await fetch(urlWithParams);
      const employeesData = await employeesResponse.json();

      if (employeesData?.status !== 'SUCCESS' || !employeesData?.data) {
        return [];
      }

      const employees = Array.isArray(employeesData.data)
        ? employeesData.data
        : employeesData.data.employees || [];

      // Step 2: Get accounts with HR_MANAGER or DEPARTMENT_MANAGER role from Auth Service
      const managerRoles = ['HR_MANAGER', 'DEPARTMENT_MANAGER'];
      const managerEmployeeIds: number[] = [];

      // For each employee, check if their account has manager role
      for (const employee of employees) {
        if (!employee.account_id) continue;

        try {
          const accountUrl = `${this.authServiceUrl}/accounts/${employee.account_id}`;
          const accountResponse = await fetch(accountUrl);
          const accountData = await accountResponse.json();

          if (
            accountData?.status === 'SUCCESS' &&
            accountData?.data
          ) {
            const account = accountData.data;
            const accountRole = account.role || account.role_code;

            if (managerRoles.includes(accountRole)) {
              managerEmployeeIds.push(employee.id);
            }
          }
        } catch (error) {
          this.logger.warn(
            `Error checking account ${employee.account_id} for employee ${employee.id}:`,
            error,
          );
          // Continue with next employee
        }
      }

      this.logger.log(
        `Found ${managerEmployeeIds.length} managers for department ${departmentId}`,
      );
      return managerEmployeeIds;
    } catch (error) {
      this.logger.error(
        `Error fetching managers for department ${departmentId}:`,
        error,
      );
      // Return empty array on error - don't block notification
      return [];
    }
  }

  /**
   * Get all HR managers (across all departments)
   * @returns Array of HR manager employee IDs
   */
  async getAllHRManagers(): Promise<number[]> {
    try {
      // Step 1: Get all employees
      const employeesUrl = `${this.employeeServiceUrl}/employees`;
      const employeesParams = {
        limit: 1000, // Get all employees
      };

      this.logger.log('Fetching all employees to find HR managers');
      const queryParams = new URLSearchParams(
        Object.entries(employeesParams).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>),
      );
      const urlWithParams = `${employeesUrl}?${queryParams.toString()}`;
      
      const employeesResponse = await fetch(urlWithParams);
      const employeesData = await employeesResponse.json();

      if (employeesData?.status !== 'SUCCESS' || !employeesData?.data) {
        return [];
      }

      const employees = Array.isArray(employeesData.data)
        ? employeesData.data
        : employeesData.data.employees || [];

      // Step 2: Check each employee's account for HR_MANAGER role
      const hrManagerIds: number[] = [];

      for (const employee of employees) {
        if (!employee.account_id) continue;

        try {
          const accountUrl = `${this.authServiceUrl}/accounts/${employee.account_id}`;
          const accountResponse = await fetch(accountUrl);
          const accountData = await accountResponse.json();

          if (
            accountData?.status === 'SUCCESS' &&
            accountData?.data
          ) {
            const account = accountData.data;
            const accountRole = account.role || account.role_code;

            if (accountRole === 'HR_MANAGER') {
              hrManagerIds.push(employee.id);
            }
          }
        } catch (error) {
          this.logger.warn(
            `Error checking account ${employee.account_id} for employee ${employee.id}:`,
            error,
          );
          // Continue with next employee
        }
      }

      this.logger.log(`Found ${hrManagerIds.length} HR managers`);
      return hrManagerIds;
    } catch (error) {
      this.logger.error('Error fetching HR managers:', error);
      return [];
    }
  }

  /**
   * Get employee information by ID
   * @param employeeId Employee ID
   * @returns Employee information
   */
  async getEmployeeById(employeeId: number): Promise<EmployeeInfo | null> {
    try {
      const url = `${this.employeeServiceUrl}/employees/${employeeId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.status === 'SUCCESS' && data?.data) {
        return data.data;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error fetching employee ${employeeId}:`, error);
      return null;
    }
  }

  /**
   * Get all employees in a department
   * @param departmentId Department ID
   * @returns Array of employee IDs
   */
  async getEmployeesByDepartment(departmentId: number): Promise<number[]> {
    try {
      const url = `${this.employeeServiceUrl}/employees?departmentId=${departmentId}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.status === 'SUCCESS' && data?.data) {
        return data.data.map((emp: any) => emp.id || emp.employeeId);
      }

      return [];
    } catch (error) {
      this.logger.error(`Error fetching employees by department ${departmentId}:`, error);
      return [];
    }
  }

  /**
   * Get all employees in the system
   * @returns Array of employee IDs
   */
  async getAllEmployees(): Promise<number[]> {
    try {
      const url = `${this.employeeServiceUrl}/employees`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.status === 'SUCCESS' && data?.data) {
        return data.data.map((emp: any) => emp.id || emp.employeeId);
      }

      return [];
    } catch (error) {
      this.logger.error(`Error fetching all employees:`, error);
      return [];
    }
  }

  /**
   * Get employees by role
   * @param role Role name (e.g., 'HR_MANAGER', 'DEPARTMENT_MANAGER')
   * @returns Array of employee IDs
   */
  async getEmployeesByRole(role: string): Promise<number[]> {
    try {
      const url = `${this.employeeServiceUrl}/employees?role=${role}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data?.status === 'SUCCESS' && data?.data) {
        return data.data.map((emp: any) => emp.id || emp.employeeId);
      }

      return [];
    } catch (error) {
      this.logger.error(`Error fetching employees by role ${role}:`, error);
      return [];
    }
  }
}

