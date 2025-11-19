import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { AttendanceEditLogRepository } from '../../../infrastructure/repositories/attendance-edit-log.repository';
import { ManualEditShiftDto } from '../../../presentation/dtos/employee-shift-edit.dto';
import { EmployeeShiftDto } from '../../dtos/employee-shift.dto';
import { EmployeeShift } from '../../../domain/entities/employee-shift.entity';

@Injectable()
export class ManualEditShiftUseCase {
  constructor(
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly attendanceEditLogRepository: AttendanceEditLogRepository,
  ) {}

  async execute(
    shiftId: number,
    dto: ManualEditShiftDto,
    currentUser: JwtPayload,
    ipAddress?: string,
  ): Promise<ApiResponseDto<EmployeeShiftDto>> {
    const shiftSchema = await this.employeeShiftRepository.findById(shiftId);
    if (!shiftSchema) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Shift not found.',
        404,
      );
    }

    const updates: Partial<typeof shiftSchema> = {};
    const logs: {
      field: string;
      oldValue?: string;
      newValue?: string;
    }[] = [];

    const applyChange = <K extends keyof typeof shiftSchema>(
      field: K,
      newValue: (typeof shiftSchema)[K],
    ) => {
      const oldValue = shiftSchema[field];
      if (
        newValue !== undefined &&
        newValue !== null &&
        newValue !== oldValue
      ) {
        (updates[field] as any) = newValue;
        logs.push({
          field: String(field),
          oldValue:
            oldValue !== undefined && oldValue !== null
              ? String(oldValue)
              : undefined,
          newValue: String(newValue),
        });
      }
    };

    // Map DTO -> persistence fields
    if (dto.check_in_time) {
      applyChange('check_in_time', new Date(dto.check_in_time));
    }
    if (dto.check_out_time) {
      applyChange('check_out_time', new Date(dto.check_out_time));
    }
    if (dto.status) {
      applyChange('status', dto.status);
    }
    if (dto.notes !== undefined) {
      applyChange('notes', dto.notes);
    }

    if (logs.length === 0) {
      // Nothing changed
      return ApiResponseDto.success(
        new EmployeeShiftDto(
          new EmployeeShift({
            id: shiftSchema.id,
            employee_id: shiftSchema.employee_id,
            employee_code: shiftSchema.employee_code,
            department_id: shiftSchema.department_id,
            shift_date: shiftSchema.shift_date,
            work_schedule_id: shiftSchema.work_schedule_id ?? 0,
            scheduled_start_time: shiftSchema.scheduled_start_time,
            scheduled_end_time: shiftSchema.scheduled_end_time,
            check_in_time: shiftSchema.check_in_time,
            check_out_time: shiftSchema.check_out_time,
            work_hours: shiftSchema.work_hours,
            overtime_hours: shiftSchema.overtime_hours,
            break_hours: shiftSchema.break_hours,
            late_minutes: shiftSchema.late_minutes,
            early_leave_minutes: shiftSchema.early_leave_minutes,
            status: shiftSchema.status as any,
            notes: shiftSchema.notes,
            is_manually_edited: shiftSchema.is_manually_edited,
            created_at: shiftSchema.created_at,
            created_by: shiftSchema.created_by,
            updated_at: shiftSchema.updated_at,
            updated_by: shiftSchema.updated_by,
          }),
        ),
        'No changes applied.',
      );
    }

    // Apply updates and mark as manually edited
    updates.is_manually_edited = true;
    updates.updated_by = currentUser.sub;
    updates.updated_at = new Date();

    await this.employeeShiftRepository.update(shiftId, updates as any);

    // Create edit logs
    for (const log of logs) {
      await this.attendanceEditLogRepository.createLog({
        shift_id: shiftSchema.id,
        employee_id: shiftSchema.employee_id,
        employee_code: shiftSchema.employee_code,
        shift_date: shiftSchema.shift_date,
        edited_by_user_id: currentUser.sub,
        edited_by_user_name: currentUser.email,
        edited_by_role: currentUser.role,
        field_changed: log.field,
        old_value: log.oldValue,
        new_value: log.newValue,
        edit_reason: dto.edit_reason,
        ip_address: ipAddress,
      });
    }

    const updated = await this.employeeShiftRepository.findById(shiftId);
    if (!updated) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Shift not found after update.',
        404,
      );
    }
    const domain = new EmployeeShift({
      id: updated.id,
      employee_id: updated.employee_id,
      employee_code: updated.employee_code,
      department_id: updated.department_id,
      shift_date: updated.shift_date,
      work_schedule_id: (updated as any).work_schedule_id ?? 0,
      scheduled_start_time: updated.scheduled_start_time,
      scheduled_end_time: updated.scheduled_end_time,
      check_in_time: updated.check_in_time,
      check_out_time: updated.check_out_time,
      work_hours: updated.work_hours,
      overtime_hours: updated.overtime_hours,
      break_hours: updated.break_hours,
      late_minutes: updated.late_minutes,
      early_leave_minutes: updated.early_leave_minutes,
      status: updated.status as any,
      notes: updated.notes,
      is_manually_edited: updated.is_manually_edited,
      created_at: updated.created_at,
      created_by: updated.created_by,
      updated_at: updated.updated_at,
      updated_by: updated.updated_by,
    });

    return ApiResponseDto.success(
      new EmployeeShiftDto(domain),
      'Shift manually edited successfully.',
    );
  }
}
