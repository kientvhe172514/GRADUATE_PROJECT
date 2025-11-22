import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export interface EmployeeInfo {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  department_id?: number;
  position_id?: number;
  role?: string;
}

@Injectable()
export class EmployeeServiceClient {
  private readonly logger = new Logger(EmployeeServiceClient.name);

  constructor(
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) {}

  /**
   * Get employee information by ID via RabbitMQ RPC
   * @param employeeId Employee ID
   * @returns Employee information
   */
  async getEmployeeById(employeeId: number): Promise<EmployeeInfo | null> {
    try {
      this.logger.log(`🔍 Fetching employee info for ID: ${employeeId}`);

      const response = await firstValueFrom(
        this.employeeClient
          .send('employee.get', { id: employeeId })
          .pipe(timeout(5000)),
      );

      if (!response || !response.data) {
        this.logger.warn(`⚠️ Employee not found: ${employeeId}`);
        return null;
      }

      const employee = response.data;
      this.logger.log(`✅ Employee fetched: ${employee.employee_code}`);

      return {
        id: employee.id,
        employee_code: employee.employee_code,
        email: employee.email,
        full_name: employee.full_name,
        department_id: employee.department_id,
        position_id: employee.position_id,
        role: employee.role,
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch employee ${employeeId}:`, error);
      throw new Error(`Failed to fetch employee info: ${error.message}`);
    }
  }

  /**
   * Get multiple employees by IDs
   * @param employeeIds Array of employee IDs
   * @returns Map of employee ID to employee info
   */
  async getEmployeesByIds(
    employeeIds: number[],
  ): Promise<Map<number, EmployeeInfo>> {
    try {
      this.logger.log(`🔍 Fetching ${employeeIds.length} employees`);

      const response = await firstValueFrom(
        this.employeeClient
          .send('employee.list', { employee_ids: employeeIds })
          .pipe(timeout(5000)),
      );

      if (!response || !response.data) {
        this.logger.warn(`⚠️ No employees found`);
        return new Map();
      }

      const employees = response.data;
      const employeeMap = new Map<number, EmployeeInfo>();

      employees.forEach((employee: any) => {
        employeeMap.set(employee.id, {
          id: employee.id,
          employee_code: employee.employee_code,
          email: employee.email,
          full_name: employee.full_name,
          department_id: employee.department_id,
          position_id: employee.position_id,
          role: employee.role,
        });
      });

      this.logger.log(`✅ Fetched ${employeeMap.size} employees`);
      return employeeMap;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch employees:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch employees: ${errorMessage}`);
    }
  }
}
