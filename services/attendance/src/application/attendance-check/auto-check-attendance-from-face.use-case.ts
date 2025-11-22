import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AttendanceCheckRepository } from '../../infrastructure/repositories/attendance-check.repository';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';

export interface AutoCheckAttendanceCommand {
  employee_id: number;
}

export interface AutoCheckAttendanceResult {
  success: boolean;
  attendance_check_id: number;
  shift_id: number;
  check_type: 'CHECK_IN' | 'CHECK_OUT';
  message: string;
}

@Injectable()
export class AutoCheckAttendanceFromFaceUseCase {
  private readonly logger = new Logger(AutoCheckAttendanceFromFaceUseCase.name);

  constructor(
    private readonly attendanceCheckRepository: AttendanceCheckRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * Logic tự động xác định CHECK_IN/CHECK_OUT:
   * 1. Tìm ca làm việc ĐÚNG GIỜ của employee (theo thời gian hiện tại)
   *    - Nếu có nhiều ca trong 1 ngày, chọn ca gần với giờ hiện tại nhất
   *    - Priority: OVERTIME > REGULAR (nếu trùng giờ)
   * 2. Lấy tất cả các lần chấm công đã có trong ca này
   * 3. Nếu chưa có lần nào -> CHECK_IN
   * 4. Nếu đã có lần -> CHECK_OUT cho lần mới, và đổi tất cả lần cũ thành CHECK_IN
   * 5. Tạo attendance_check mới với check_type đã xác định
   * 6. Trả về attendance_check_id để Face Recognition Service xử lý tiếp
   */
  async execute(
    command: AutoCheckAttendanceCommand,
  ): Promise<AutoCheckAttendanceResult> {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current time in HH:MM format for comparison
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.logger.log(
      `Auto-checking attendance for employee_id=${command.employee_id} at ${now.toISOString()} (${currentTime})`,
    );

    // Step 1: Find active shift at current time
    // Get all shifts of employee today (may have multiple: morning + afternoon, or regular + OT)
    const shift = await this.employeeShiftRepository.findActiveShiftByTime(
      command.employee_id,
      today,
      currentTime,
    );

    if (!shift) {
      throw new BadRequestException(
        `No active shift found for employee_id=${command.employee_id} at ${currentTime}. ` +
          `Please contact HR to assign a work schedule or check if you're within shift hours.`,
      );
    }

    this.logger.log(
      `Found ${shift.shift_type} shift (shift_id=${shift.id}, ${shift.scheduled_start_time}-${shift.scheduled_end_time}) ` +
        `for employee_id=${command.employee_id}`,
    );

    // Step 2: Get all attendance checks for this shift
    const existingChecks = await this.attendanceCheckRepository.findByShiftId(
      shift.id,
    );

    // Step 3: Determine check_type based on existing checks
    let checkType: 'CHECK_IN' | 'CHECK_OUT';

    if (existingChecks.length === 0) {
      // First check -> CHECK_IN
      checkType = 'CHECK_IN';
      this.logger.log(
        `No existing checks found. New check will be CHECK_IN (shift_id=${shift.id})`,
      );
    } else {
      // Has existing checks -> New one is CHECK_OUT
      checkType = 'CHECK_OUT';
      this.logger.log(
        `Found ${existingChecks.length} existing check(s). New check will be CHECK_OUT (shift_id=${shift.id})`,
      );

      // Step 4: Update all previous checks to CHECK_IN (if they were CHECK_OUT)
      for (const check of existingChecks) {
        if (check.check_type === 'CHECK_OUT') {
          await this.attendanceCheckRepository.updateCheckType(
            check.id,
            'CHECK_IN',
          );
          this.logger.log(
            `Updated attendance_check_id=${check.id} from CHECK_OUT to CHECK_IN`,
          );
        }
      }
    }

    // Step 5: Create new attendance check record
    // Note: Get employee_code and department_id from shift
    const newCheck = await this.attendanceCheckRepository.create({
      employee_id: command.employee_id,
      employee_code: shift.employee_code,
      department_id: shift.department_id,
      shift_id: shift.id,
      check_type: checkType,
      beacon_validated: false, // Will be updated by Face Recognition Service
      gps_validated: false,
      face_verified: false,
      is_valid: false, // Will be set to true after face verification
      created_at: new Date(),
    });

    this.logger.log(
      `✅ Created attendance_check_id=${newCheck.id} with check_type=${checkType} for shift_id=${shift.id}`,
    );

    return {
      success: true,
      attendance_check_id: newCheck.id,
      shift_id: shift.id,
      check_type: checkType,
      message: `Attendance check created successfully. Type: ${checkType}`,
    };
  }
}
