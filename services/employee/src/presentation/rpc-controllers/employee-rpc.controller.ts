import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetEmployeeDetailUseCase } from '../../application/use-cases/get-employee-detail.use-case';
import { GetEmployeesUseCase } from '../../application/use-cases/get-employees.use-case';
import { ResponseStatus } from '@graduate-project/shared-common';

/**
 * RPC Controller for Employee Service
 * Handles RabbitMQ RPC requests from other microservices
 */
@Controller()
export class EmployeeRpcController {
  private readonly logger = new Logger(EmployeeRpcController.name);

  constructor(
    private readonly getEmployeeDetailUseCase: GetEmployeeDetailUseCase,
    private readonly getEmployeesUseCase: GetEmployeesUseCase,
  ) {}

  /**
   * RPC: Get employee by ID
   * Pattern: 'employee.get'
   * Payload: { id: number }
   * Response: { status, statusCode, message, data: EmployeeDetailDto }
   */
  @MessagePattern('employee.get')
  async getEmployeeById(@Payload() payload: { id: number }): Promise<any> {
    this.logger.log(`🔍 [RPC] employee.get - ID: ${payload.id}`);

    try {
      const employee = await this.getEmployeeDetailUseCase.execute(payload.id);

      if (!employee) {
        this.logger.warn(`⚠️ [RPC] Employee not found: ${payload.id}`);
        return {
          status: ResponseStatus.ERROR,
          statusCode: 404,
          message: 'Employee not found',
          data: null,
        };
      }

      this.logger.log(`✅ [RPC] Employee found: ${employee.employee_code}`);
      return {
        status: ResponseStatus.SUCCESS,
        statusCode: 200,
        message: 'Employee retrieved successfully',
        data: employee,
      };
    } catch (error) {
      this.logger.error(`❌ [RPC] Error fetching employee ${payload.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseStatus.ERROR,
        statusCode: 500,
        message: `Failed to fetch employee: ${errorMessage}`,
        data: null,
      };
    }
  }

  /**
   * RPC: Get multiple employees by IDs
   * Pattern: 'employee.list'
   * Payload: { ids: number[] }
   * Response: { status, statusCode, message, data: EmployeeDetailDto[] }
   */
  @MessagePattern('employee.list')
  async getEmployeesByIds(@Payload() payload: { ids: number[] }): Promise<any> {
    this.logger.log(`🔍 [RPC] employee.list - IDs: [${payload.ids.join(', ')}]`);

    try {
      const result = await this.getEmployeesUseCase.execute({
        ids: payload.ids,
      });

      const items = result?.data?.items || [];
      this.logger.log(`✅ [RPC] Found ${items.length} employees`);
      return {
        status: ResponseStatus.SUCCESS,
        statusCode: 200,
        message: 'Employees retrieved successfully',
        data: items,
      };
    } catch (error) {
      this.logger.error(`❌ [RPC] Error fetching employees:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseStatus.ERROR,
        statusCode: 500,
        message: `Failed to fetch employees: ${errorMessage}`,
        data: [],
      };
    }
  }

  /**
   * RPC: Check if employee exists
   * Pattern: 'employee.exists'
   * Payload: { id: number }
   * Response: { status, statusCode, message, data: { exists: boolean } }
   */
  @MessagePattern('employee.exists')
  async checkEmployeeExists(@Payload() payload: { id: number }): Promise<any> {
    this.logger.log(`🔍 [RPC] employee.exists - ID: ${payload.id}`);

    try {
      const employee = await this.getEmployeeDetailUseCase.execute(payload.id);
      const exists = !!employee;

      this.logger.log(`✅ [RPC] Employee ${payload.id} exists: ${exists}`);
      return {
        status: ResponseStatus.SUCCESS,
        statusCode: 200,
        message: 'Employee existence checked',
        data: { exists },
      };
    } catch (error) {
      this.logger.error(`❌ [RPC] Error checking employee ${payload.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: ResponseStatus.ERROR,
        statusCode: 500,
        message: `Failed to check employee: ${errorMessage}`,
        data: { exists: false },
      };
    }
  }
}
