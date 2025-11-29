import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, TimeoutError } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { ResponseStatus } from '@graduate-project/shared-common';
import { EmployeeProfileServicePort } from '../../application/ports/employee-profile.service.port';
import { EmployeeProfileDto } from '../../application/dto/employee/employee-profile.dto';

interface EmployeeRpcResponse<T = any> {
  status: ResponseStatus | string;
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class EmployeeRpcService implements EmployeeProfileServicePort {
  private readonly logger = new Logger(EmployeeRpcService.name);

  constructor(
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) {}

  async getEmployeeById(id: number): Promise<EmployeeProfileDto | null> {
    try {
      const response = await lastValueFrom(
        this.employeeClient
          .send<EmployeeRpcResponse>('employee.get', { id })
          .pipe(timeout(5000)),
      );

      if (!response || response.status !== ResponseStatus.SUCCESS || !response.data) {
        this.logger.warn(
          `Employee profile not available for account employee_id=${id}: ${response?.message}`,
        );
        return null;
      }

      const data = response.data as Record<string, any>;
      return {
        id: data.id,
        phone: data.phone_number ?? null,
        address: data.address ?? null,
        dateOfBirth: data.date_of_birth ?? null,
      };
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`Timeout while fetching employee ${id} profile`);
      } else {
        const err = error as Error;
        this.logger.error(
          `Failed to fetch employee ${id} profile: ${err.message}`,
          err.stack,
        );
      }
      return null;
    }
  }

  async getManagedDepartmentIds(employeeId: number): Promise<number[]> {
    try {
      const response = await lastValueFrom(
        this.employeeClient
          .send<EmployeeRpcResponse>('employee.getManagedDepartments', { employee_id: employeeId })
          .pipe(timeout(5000)),
      );

      if (!response || response.status !== ResponseStatus.SUCCESS || !response.data) {
        this.logger.warn(
          `Managed departments not available for employee_id=${employeeId}: ${response?.message}`,
        );
        return [];
      }

      const data = response.data as Record<string, any>;
      return data.department_ids ?? [];
    } catch (error) {
      if (error instanceof TimeoutError) {
        this.logger.error(`Timeout while fetching managed departments for employee ${employeeId}`);
      } else {
        const err = error as Error;
        this.logger.error(
          `Failed to fetch managed departments for employee ${employeeId}: ${err.message}`,
          err.stack,
        );
      }
      return [];
    }
  }
}

