import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import {
  GetActiveShiftForEmployeeUseCase,
  GetActiveShiftForEmployeeCommand,
  ActiveShiftResult,
} from '../../application/use-cases/employee-shift/get-active-shift-for-employee.use-case';

@Controller()
export class AttendanceRpcController {
  private readonly logger = new Logger(AttendanceRpcController.name);

  constructor(
    private readonly getActiveShiftUseCase: GetActiveShiftForEmployeeUseCase,
  ) {}

  /**
   * RPC endpoint for Auth service to check active shift
   * Used for device change validation during login
   */
  @MessagePattern('attendance.get_active_shift')
  async getActiveShift(
    data: GetActiveShiftForEmployeeCommand,
  ): Promise<ActiveShiftResult> {
    this.logger.log(
      `[RPC] Received get_active_shift request for employee_id=${data.employee_id}`,
    );

    const result = await this.getActiveShiftUseCase.execute(data);

    this.logger.log(
      `[RPC] Returning active shift result: has_active_shift=${result.has_active_shift}`,
    );

    return result;
  }
}
