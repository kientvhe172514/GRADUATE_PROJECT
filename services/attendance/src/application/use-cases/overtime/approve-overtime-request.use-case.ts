import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { TypeOrmEmployeeWorkScheduleRepository } from '../../../infrastructure/repositories/typeorm-work-schedule.repository';
import { GpsCheckCalculatorService } from '../../services/gps-check-calculator.service';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import {
  ScheduleOverrideStatus,
  ScheduleOverrideType,
} from '../../../domain/entities/employee-work-schedule.entity';
import { EmployeeShiftSchema } from '../../../infrastructure/persistence/typeorm/employee-shift.schema';

@Injectable()
export class ApproveOvertimeRequestUseCase {
  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    private readonly employeeShiftRepo: EmployeeShiftRepository,
    private readonly employeeWorkScheduleRepo: TypeOrmEmployeeWorkScheduleRepository,
    private readonly gpsCheckCalculator: GpsCheckCalculatorService,
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
        id: request.employee_id, // ✅ Fixed: Employee Service expects "id" not "employee_id"
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

    // Format time strings (HH:mm:ss) - FIX TIMEZONE
    const formatTime = (date: Date): string => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    };

    // Parse times from request with proper timezone handling
    const requestStartTime = new Date(request.start_time);
    const requestEndTime = new Date(request.end_time);
    
    const startTime = formatTime(requestStartTime);
    const endTime = formatTime(requestEndTime);

    // Check if overtime is TODAY or FUTURE
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse overtime_date (could be string or Date)
    const overtimeDate = typeof request.overtime_date === 'string' 
      ? new Date(request.overtime_date) 
      : new Date(request.overtime_date);
    overtimeDate.setHours(0, 0, 0, 0);
    
    const isToday = overtimeDate.getTime() === today.getTime();
    const isFuture = overtimeDate > today;

    let otShift: EmployeeShiftSchema | null = null;

    if (isToday) {
      // TODAY: Create shift immediately (need GPS tracking now)
      const overtimeDateStr = typeof request.overtime_date === 'string' 
        ? request.overtime_date 
        : request.overtime_date.toISOString().split('T')[0];
      
      console.log(
        `[APPROVE-OT] Creating IMMEDIATE shift for TODAY (${overtimeDateStr})`,
      );

      const gpsChecksRequired =
        await this.gpsCheckCalculator.calculateRequiredChecks(
          'OVERTIME',
          startTime,
          endTime,
        );

      otShift = await this.employeeShiftRepo.create({
        employee_id: request.employee_id,
        employee_code,
        department_id,
        shift_date: request.overtime_date,
        scheduled_start_time: startTime,
        scheduled_end_time: endTime,
        shift_type: 'OVERTIME',
        presence_verification_required: true,
        presence_verification_rounds_required: gpsChecksRequired,
      });

      console.log(`[APPROVE-OT] Created shift ID: ${otShift.id}`);
    } else if (isFuture) {
      // FUTURE: Add to schedule_overrides (cronjob will create shift later)
      console.log(
        `[APPROVE-OT] Adding OVERRIDE for FUTURE date (${request.overtime_date.toISOString()})`,
      );

      // Find active work schedule assignment for this employee
      const workSchedule =
        await this.employeeWorkScheduleRepo.findByEmployeeIdAndDate(
          request.employee_id,
          request.overtime_date,
        );

      if (!workSchedule) {
        throw new BusinessException(
          ErrorCodes.NOT_FOUND,
          'No work schedule assignment found for this employee on the overtime date',
          404,
        );
      }

      // Add overtime to schedule_overrides
      const existingOverrides = Array.isArray(workSchedule.schedule_overrides)
        ? workSchedule.schedule_overrides
        : [];

      const newOverride = {
        id: `ot-${Date.now()}`, // Unique string ID
        type: ScheduleOverrideType.OVERTIME,
        from_date: request.overtime_date.toISOString().split('T')[0],
        to_date: request.overtime_date.toISOString().split('T')[0],
        overtime_start_time: startTime,
        overtime_end_time: endTime,
        reason: request.reason || 'Approved overtime request',
        created_by: currentUser.sub,
        created_at: new Date().toISOString(),
        status: ScheduleOverrideStatus.PENDING,
        shift_created: false,
      };

      const updatedOverrides = [...existingOverrides, newOverride];

      // Update work schedule with new override
      await this.employeeWorkScheduleRepo.update(workSchedule.id, {
        schedule_overrides: updatedOverrides,
      });

      console.log(
        `[APPROVE-OT] Added override to work_schedule_assignment ID: ${workSchedule.id}`,
      );
    } else {
      // PAST: Cannot approve past overtime
      throw new BusinessException(
        ErrorCodes.INVALID_INPUT,
        'Cannot approve overtime for past dates',
        400,
      );
    }

    // Update overtime request status
    const approved = await this.overtimeRepo.approveRequest(
      id,
      currentUser.sub,
      otShift?.id ?? undefined, // Can be undefined if future overtime (shift not created yet)
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
      ot_shift_id: otShift?.id ?? null,
      is_immediate: isToday,
    });

    return ApiResponseDto.success(
      undefined,
      isToday
        ? 'Overtime request approved and shift created successfully'
        : 'Overtime request approved successfully. Shift will be created automatically on the scheduled date.',
    );
  }
}
