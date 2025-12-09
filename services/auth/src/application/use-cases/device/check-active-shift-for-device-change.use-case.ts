import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

export interface CheckActiveShiftResult {
  has_active_shift: boolean;
  shift_id?: number;
  check_in_time?: Date;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  time_until_shift_start_hours?: number;
  can_change_device: boolean;
  message?: string;
}

/**
 * Use Case: Check if employee has active shift and can change device
 * 
 * Business Rules:
 * 1. Nếu employee ĐANG TRONG CA (status = IN_PROGRESS, đã check-in) 
 *    → KHÔNG CHO login thiết bị mới
 * 
 * 2. Nếu ca sắp bắt đầu (trong vòng X giờ tới, ví dụ 3 giờ)
 *    → KHÔNG CHO login thiết bị mới
 * 
 * 3. Chỉ CHO ĐỔI THIẾT BỊ khi:
 *    - Không có ca đang diễn ra
 *    - Ca tiếp theo còn xa (> 3 giờ)
 * 
 * Purpose: Ngăn chặn gian lận GPS bằng cách:
 * - Check-in xong đổi sang thiết bị khác để fake GPS
 */
@Injectable()
export class CheckActiveShiftForDeviceChangeUseCase {
  // ✅ Time buffer: Không cho đổi thiết bị trong vòng 3 giờ trước ca
  private readonly DEVICE_CHANGE_BUFFER_HOURS = 3;

  constructor(
    @Inject('ATTENDANCE_SERVICE')
    private readonly attendanceClient: ClientProxy,
  ) {}

  async execute(employeeId: number): Promise<CheckActiveShiftResult> {
    try {
      // Query Attendance Service to check if employee has active shift
      const response = await firstValueFrom(
        this.attendanceClient.send(
          { cmd: 'check_active_shift_for_device_change' },
          { employee_id: employeeId },
        ),
      );

      if (!response || !response.has_active_shift) {
        return {
          has_active_shift: false,
          can_change_device: true,
        };
      }

      // Employee has active shift or upcoming shift
      const {
        shift_id,
        check_in_time,
        scheduled_start_time,
        scheduled_end_time,
        time_until_shift_start_hours,
        status,
      } = response;

      // ❌ CASE 1: Đang trong ca (đã check-in)
      if (status === 'IN_PROGRESS' && check_in_time) {
        return {
          has_active_shift: true,
          shift_id,
          check_in_time: new Date(check_in_time),
          scheduled_start_time,
          scheduled_end_time,
          can_change_device: false,
          message: `Bạn đang trong ca làm việc (${scheduled_start_time} - ${scheduled_end_time}). Không thể đăng nhập thiết bị mới khi đang làm việc.`,
        };
      }

      // ❌ CASE 2: Ca sắp bắt đầu (trong vòng buffer time)
      if (
        time_until_shift_start_hours !== undefined &&
        time_until_shift_start_hours <= this.DEVICE_CHANGE_BUFFER_HOURS
      ) {
        return {
          has_active_shift: true,
          shift_id,
          scheduled_start_time,
          scheduled_end_time,
          time_until_shift_start_hours,
          can_change_device: false,
          message: `Ca làm việc sắp bắt đầu (${scheduled_start_time} - ${scheduled_end_time}, còn ${time_until_shift_start_hours.toFixed(1)} giờ nữa). Không thể đổi thiết bị trong vòng ${this.DEVICE_CHANGE_BUFFER_HOURS} giờ trước ca làm.`,
        };
      }

      // ✅ Ca còn xa, cho phép đổi thiết bị
      return {
        has_active_shift: true,
        shift_id,
        scheduled_start_time,
        scheduled_end_time,
        time_until_shift_start_hours,
        can_change_device: true,
      };
    } catch (error) {
      console.error('Error checking active shift:', error);
      // If attendance service fails, allow login (fail-open)
      return {
        has_active_shift: false,
        can_change_device: true,
      };
    }
  }
}
