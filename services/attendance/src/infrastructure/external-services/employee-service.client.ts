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
          .send({ cmd: 'get_employee_by_id' }, { id: employeeId })
          .pipe(timeout(5000)),
      );

      if (!response) {
        this.logger.warn(`⚠️ Employee not found: ${employeeId}`);
        return null;
      }

      const employee = response;
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
      this.logger.log(`📋 Requested IDs: [${employeeIds.join(', ')}]`);

      const response = await firstValueFrom(
        this.employeeClient
          .send('employee.list', { employee_ids: employeeIds })
          .pipe(timeout(5000)),
      );

      this.logger.debug(`📦 Raw RPC response:`, JSON.stringify(response));

      if (!response || !response.data) {
        this.logger.warn(`⚠️ No employees found - response structure invalid`);
        this.logger.warn(`Response:`, JSON.stringify(response));
        return new Map();
      }

      const employees = response.data;
      this.logger.log(`📊 Response contains ${employees.length} employees`);

      const employeeMap = new Map<number, EmployeeInfo>();

      employees.forEach((employee: any, index: number) => {
        // Ensure ID is a number (RPC might return string)
        const employeeId = Number(employee.id);
        this.logger.debug(
          `Processing employee ${index + 1}: ID=${employeeId} (type: ${typeof employee.id}), code=${employee.employee_code}`,
        );
        employeeMap.set(employeeId, {
          id: employeeId,
          employee_code: employee.employee_code,
          email: employee.email,
          full_name: employee.full_name,
          department_id: employee.department_id,
          position_id: employee.position_id,
          role: employee.role,
        });
      });

      const fetchedIds = Array.from(employeeMap.keys()).sort((a, b) => a - b);
      this.logger.log(
        `✅ Fetched ${employeeMap.size} employees: [${fetchedIds.join(', ')}]`,
      );

      // Log missing employees
      const missingIds = employeeIds.filter((id) => !employeeMap.has(id));
      if (missingIds.length > 0) {
        this.logger.warn(
          `⚠️ Missing ${missingIds.length} employees: [${missingIds.join(', ')}]`,
        );
        this.logger.warn(
          `❌ Employee service did NOT return these IDs - they may not exist in employee database`,
        );
      }

      return employeeMap;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch employees:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch employees: ${errorMessage}`);
    }
  }
}
