import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, catchError } from 'rxjs';

export const EMPLOYEE_SERVICE_CLIENT = 'EMPLOYEE_SERVICE';

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
  private readonly employeeServiceUrl: string = 'http://employee:3002'; // TODO: Move to env
  private readonly authServiceUrl: string = 'http://auth:3001'; // TODO: Move to env

  constructor(
    @Inject(EMPLOYEE_SERVICE_CLIENT)
    private readonly employeeServiceClient: ClientProxy,
  ) {}

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
   * Get employee information by ID via RabbitMQ RPC
   * @param employeeId Employee ID
   * @returns Employee information
   */
  async getEmployeeById(employeeId: number): Promise<EmployeeInfo | null> {
    try {
      this.logger.log(`🔍 Fetching employee ${employeeId} via RPC`);
      
      const response = await firstValueFrom(
        this.employeeServiceClient.send('employee.get', { id: employeeId }).pipe(
          timeout(5000), // 5s timeout
          catchError((error) => {
            this.logger.error(`RPC error for employee ${employeeId}:`, error);
            return [null];
          })
        )
      );

      if (response && response.status === 'SUCCESS' && response.data) {
        this.logger.log(`✅ Employee ${employeeId} found: ${response.data.full_name}`);
        return {
          id: response.data.id,
          employee_code: response.data.employee_code,
          email: response.data.email,
          full_name: response.data.full_name,
          department_id: response.data.department_id,
          role: response.data.role,
        };
      }

      this.logger.warn(`⚠️ Employee ${employeeId} not found in RPC response`);
      return null;
    } catch (error) {
      this.logger.error(`Error fetching employee ${employeeId}:`, error);
      return null;
    }
  }

  // TODO: Convert these methods to RabbitMQ RPC
  /**
   * Get all employees in a department (HTTP fallback)
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
   * Get all employees in the system (HTTP fallback)
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
   * Get employees by role (HTTP fallback)
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

