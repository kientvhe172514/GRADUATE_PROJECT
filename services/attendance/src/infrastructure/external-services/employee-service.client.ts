import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

export interface EmployeeInfo {
  id: number;
  employee_code: string;
  email: string;
  full_name: string;
  department_id?: number;
  department_name?: string;
  department?: {
    id: number;
    department_name?: string;
    manager_id?: number | null;
    office_latitude?: number | string;
    office_longitude?: number | string;
    office_radius_meters?: number | string;
  };
  position_id?: number;
  role?: string;
  position?: {
    id: number;
    position_name: string;
    suggested_role: string;
  };
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
        department_name: employee.department_name,
        // Pass through nested department if present (contains manager_id and office coords)
        department: employee.department
          ? {
              id: employee.department.id,
              department_name: employee.department.department_name,
              manager_id: employee.department.manager_id ?? null,
              office_latitude: employee.department.office_latitude,
              office_longitude: employee.department.office_longitude,
              office_radius_meters: employee.department.office_radius_meters,
            }
          : undefined,
        position_id: employee.position_id,
        role: employee.role,
        position: employee.position
          ? {
              id: employee.position.id,
              position_name: employee.position.position_name,
              suggested_role: employee.position.suggested_role,
            }
          : undefined,
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
          department_name: employee.department_name,
          position_id: employee.position_id,
          role: employee.role,
          position: employee.position ? {
            id: employee.position.id,
            position_name: employee.position.position_name,
            suggested_role: employee.position.suggested_role,
          } : undefined,
        });
      });

      const fetchedIds = Array.from(employeeMap.keys()).sort((a, b) => a - b);
      this.logger.log(
        `✅ Fetched ${employeeMap.size} employees: [${fetchedIds.join(', ')}]`,
      );

      // DEBUG: Test Map.has() directly
      this.logger.debug(
        `🔍 Testing Map.has(): employeeMap.has(11) = ${employeeMap.has(11)}`,
      );
      this.logger.debug(
        `🔍 Map keys type check: ${fetchedIds.map((id) => `${id}:${typeof id}`).join(', ')}`,
      );
      this.logger.debug(
        `🔍 Requested IDs type check: ${employeeIds.map((id) => `${id}:${typeof id}`).join(', ')}`,
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

  /**
   * Get ALL employees (no filter, including INACTIVE/TERMINATED)
   * @returns Map of employee ID to employee info
   */
  async getAllEmployees(): Promise<Map<number, EmployeeInfo>> {
    try {
      this.logger.log(`🔍 Fetching ALL employees`);

      // Use new RPC pattern: { cmd: 'get_all_employees' }
      const employees = await firstValueFrom(
        this.employeeClient
          .send({ cmd: 'get_all_employees' }, {})
          .pipe(timeout(10000)), // Longer timeout for all employees
      );

      this.logger.debug(`📦 Raw RPC response:`, JSON.stringify(employees));

      if (!Array.isArray(employees)) {
        this.logger.warn(`⚠️ Invalid response format - expected array`);
        return new Map();
      }

      this.logger.log(`📊 Response contains ${employees.length} employees`);

      const employeeMap = new Map<number, EmployeeInfo>();

      employees.forEach((employee: any) => {
        const employeeId = Number(employee.id);
        employeeMap.set(employeeId, {
          id: employeeId,
          employee_code: employee.employee_code,
          email: employee.email,
          full_name: employee.full_name,
          department_id: employee.department_id,
          department_name: employee.department_name,
          position_id: employee.position_id,
          role: employee.role,
          position: employee.position ? {
            id: employee.position.id,
            position_name: employee.position.position_name,
            suggested_role: employee.position.suggested_role,
          } : undefined,
        });
      });

      this.logger.log(`✅ Fetched ${employeeMap.size} employees total`);
      return employeeMap;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch all employees:`, error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to fetch all employees: ${errorMessage}`);
    }
  }
}
