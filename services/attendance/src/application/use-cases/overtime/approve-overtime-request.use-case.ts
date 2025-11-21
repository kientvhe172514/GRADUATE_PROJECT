import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApproveOvertimeRequestUseCase {
  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly employeeShiftRepo: EmployeeShiftRepository,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) {}

  async execute(
    id: number,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    const request = await this.overtimeRepo.findOne({ where: { id } });

    if (!request) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Overtime request not found',
        404,
      );
    }

    // Fetch employee info from EMPLOYEE_SERVICE
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const employeeInfo: any = await firstValueFrom(
      this.employeeClient.send('employee.get', {
        employee_id: request.employee_id,
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!employeeInfo || !employeeInfo.data) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Employee not found',
        404,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const employee_code = employeeInfo.data.employee_code as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const department_id = employeeInfo.data.department_id as number;

    // Format time strings (HH:mm:ss)
    const formatTime = (date: Date): string => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    // Create OT shift for approved request
    const otShift = await this.employeeShiftRepo.create({
      employee_id: request.employee_id,
      employee_code,
      department_id,
      shift_date: request.overtime_date,
      scheduled_start_time: formatTime(new Date(request.start_time)),
      scheduled_end_time: formatTime(new Date(request.end_time)),
      shift_type: 'OVERTIME',
      presence_verification_required: true,
      presence_verification_rounds_required: 0,
    });

    // Update overtime request with ot_shift_id
    const approved = await this.overtimeRepo.approveRequest(
      id,
      currentUser.sub,
      otShift.id,
    );

    if (!approved) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Overtime approval failed.',
        500,
      );
    }

    this.notificationClient.emit('overtime.approved', {
      employee_id: request.employee_id,
      overtime_date: request.overtime_date,
      estimated_hours: request.estimated_hours,
      ot_shift_id: otShift.id,
    });

    return ApiResponseDto.success(
      undefined,
      'Overtime request approved successfully',
    );
  }
}
