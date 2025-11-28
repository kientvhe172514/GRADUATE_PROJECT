import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  IWorkScheduleRepository,
  IEmployeeWorkScheduleRepository,
} from '../ports/work-schedule.repository.port';
import {
  WORK_SCHEDULE_REPOSITORY,
  EMPLOYEE_WORK_SCHEDULE_REPOSITORY,
} from '../tokens';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { GpsCheckCalculatorService } from './gps-check-calculator.service';
import { EmployeeShift, ShiftType } from '../../domain/entities/employee-shift.entity';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

export interface GenerateShiftsOptions {
  employeeId?: number; // Nếu null → generate cho tất cả employees
  startDate: Date;
  endDate: Date;
  skipExisting?: boolean; // Mặc định true: không tạo nếu đã tồn tại
}

export interface GenerateShiftsResult {
  totalProcessed: number;
  shiftsCreated: number;
  shiftsSkipped: number;
  errors: Array<{ employeeId: number; error: string }>;
}

/**
 * Service to generate employee shifts based on assigned work schedules
 * 
 * KEY FEATURES:
 * - Respects assignment effective dates (effective_from, effective_to)
 * - Prevents duplicate shift creation
 * - Handles different schedule types (FIXED, FLEXIBLE, SHIFT_BASED)
 * - Calculates GPS check requirements based on shift duration
 * - Logs detailed information for debugging
 */
@Injectable()
export class ShiftGeneratorService {
  private readonly logger = new Logger(ShiftGeneratorService.name);

  constructor(
    @Inject(WORK_SCHEDULE_REPOSITORY)
    private readonly workScheduleRepository: IWorkScheduleRepository,
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepository: IEmployeeWorkScheduleRepository,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly gpsCheckCalculator: GpsCheckCalculatorService,
    private readonly dataSource: DataSource,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  /**
   * Generate shifts for employees based on their assigned work schedules
   * 
   * LOGIC:
   * 1. Query active employee_work_schedules trong khoảng startDate → endDate
   * 2. Với mỗi assignment, tạo shifts cho các ngày làm việc
   * 3. Check xem shift đã tồn tại chưa (tránh duplicate)
   * 4. Tính toán GPS checks required dựa trên shift duration
   * 5. Chỉ tạo shifts trong khoảng effective_from → effective_to
   */
  async generateShifts(
    options: GenerateShiftsOptions,
  ): Promise<GenerateShiftsResult> {
    const startTime = Date.now();
    this.logger.log(
      `🔄 Starting shift generation from ${options.startDate.toISOString()} to ${options.endDate.toISOString()}`,
    );

    const result: GenerateShiftsResult = {
      totalProcessed: 0,
      shiftsCreated: 0,
      shiftsSkipped: 0,
      errors: [],
    };

    try {
      // Step 1: Query active assignments trong date range
      const assignments = await this.queryActiveAssignments(
        options.startDate,
        options.endDate,
        options.employeeId,
      );

      if (assignments.length === 0) {
        this.logger.log('ℹ️ No active work schedule assignments found');
        return result;
      }

      this.logger.log(`📋 Found ${assignments.length} active assignments`);
      result.totalProcessed = assignments.length;

      // Step 2: Process each assignment
      for (const assignment of assignments) {
        try {
          const { created, skipped } = await this.generateShiftsForAssignment(
            assignment,
            options.startDate,
            options.endDate,
            options.skipExisting ?? true,
          );

          result.shiftsCreated += created;
          result.shiftsSkipped += skipped;
        } catch (error) {
          this.logger.error(
            `❌ Error generating shifts for employee ${assignment.employee_id}:`,
            error,
          );
          result.errors.push({
            employeeId: assignment.employee_id,
            error: (error as Error).message,
          });
        }
      }

      const duration = (Date.now() - startTime) / 1000;
      this.logger.log(
        `✅ Shift generation completed in ${duration}s. Created: ${result.shiftsCreated}, Skipped: ${result.shiftsSkipped}, Errors: ${result.errors.length}`,
      );
    } catch (error) {
      this.logger.error('❌ Fatal error in shift generation:', error);
      throw error;
    }

    return result;
  }

  /**
   * Generate shifts for a single employee assignment
   */
  private async generateShiftsForAssignment(
    assignment: any,
    startDate: Date,
    endDate: Date,
    skipExisting: boolean,
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    // Lấy work schedule details
    const workSchedule = await this.workScheduleRepository.findById(
      assignment.work_schedule_id,
    );

    if (!workSchedule) {
      throw new Error(
        `Work schedule ${assignment.work_schedule_id} not found`,
      );
    }

    // Parse work_days (e.g., "1,2,3,4,5" → [1,2,3,4,5])
    const workDaysArray = workSchedule.work_days
      ? workSchedule.work_days.split(',').map((d) => parseInt(d.trim()))
      : [];

    if (workDaysArray.length === 0) {
      this.logger.warn(
        `⚠️ Work schedule ${workSchedule.id} has no work_days defined`,
      );
      return { created, skipped };
    }

    // Iterate qua từng ngày trong range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Check 1: Ngày này có nằm trong effective_from → effective_to không?
      const assignmentEffectiveFrom = new Date(assignment.effective_from);
      assignmentEffectiveFrom.setHours(0, 0, 0, 0);

      if (currentDate < assignmentEffectiveFrom) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue; // Chưa đến ngày hiệu lực
      }

      if (assignment.effective_to) {
        const assignmentEffectiveTo = new Date(assignment.effective_to);
        assignmentEffectiveTo.setHours(23, 59, 59, 999);

        if (currentDate > assignmentEffectiveTo) {
          break; // Đã hết hiệu lực → stop luôn
        }
      }

      // Check 2: Ngày này có phải ngày làm việc không?
      const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
      if (!workDaysArray.includes(dayOfWeek)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue; // Không phải ngày làm việc
      }

      // Check 3: Shift đã tồn tại chưa?
      if (skipExisting) {
        const existingShift =
          await this.employeeShiftRepository.findRegularShiftByEmployeeAndDate(
            assignment.employee_id,
            new Date(currentDate),
          );

        if (existingShift) {
          skipped++;
          currentDate.setDate(currentDate.getDate() + 1);
          continue; // Đã có shift → skip
        }
      }

      // Step 4: Fetch employee info from Employee Service
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(
        assignment.employee_id,
      );

      if (!employeeInfo || !employeeInfo.department_id) {
        this.logger.warn(
          `⚠️ Employee ${assignment.employee_id} not found or missing department, skipping shift generation`,
        );
        skipped++;
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Step 5: Tính GPS checks required
      const gpsChecksRequired =
        await this.gpsCheckCalculator.calculateRequiredChecks(
          'REGULAR',
          workSchedule.start_time || '08:00:00',
          workSchedule.end_time || '17:00:00',
        );

      // Step 6: Tạo shift mới với employee data từ Employee Service
      const newShift = await this.employeeShiftRepository.create({
        employee_id: assignment.employee_id,
        employee_code: employeeInfo.employee_code,
        department_id: employeeInfo.department_id,
        shift_date: new Date(currentDate),
        work_schedule_id: assignment.work_schedule_id,
        scheduled_start_time: workSchedule.start_time || '08:00',
        scheduled_end_time: workSchedule.end_time || '17:00',
        shift_type: ShiftType.REGULAR,
        presence_verification_required: true,
        presence_verification_rounds_required: gpsChecksRequired,
      });

      created++;
      this.logger.debug(
        `✅ Created shift for employee ${employeeInfo.employee_code} on ${currentDate.toISOString().split('T')[0]}`,
      );

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { created, skipped };
  }

  /**
   * Query active employee work schedule assignments
   */
  private async queryActiveAssignments(
    startDate: Date,
    endDate: Date,
    employeeId?: number,
  ): Promise<any[]> {
    const query = `
      SELECT 
        ews.id as assignment_id,
        ews.employee_id,
        ews.work_schedule_id,
        ews.effective_from,
        ews.effective_to,
        ws.schedule_name,
        ws.schedule_type,
        ws.work_days,
        ws.start_time,
        ws.end_time
      FROM employee_work_schedules ews
      INNER JOIN work_schedules ws ON ws.id = ews.work_schedule_id
      WHERE 
        ws.status = 'ACTIVE'
        -- Assignment phải có hiệu lực trong khoảng startDate → endDate
        AND (
          -- effective_from <= endDate
          ews.effective_from <= $2
          AND (
            -- effective_to IS NULL (vô thời hạn) OR effective_to >= startDate
            ews.effective_to IS NULL OR ews.effective_to >= $1
          )
        )
        ${employeeId ? 'AND ews.employee_id = $3' : ''}
      ORDER BY ews.employee_id, ews.effective_from
    `;

    const params = employeeId
      ? [startDate, endDate, employeeId]
      : [startDate, endDate];

    return await this.dataSource.query(query, params);
  }

  /**
   * Generate shifts for a specific employee (useful for manual trigger)
   */
  async generateShiftsForEmployee(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<GenerateShiftsResult> {
    return this.generateShifts({
      employeeId,
      startDate,
      endDate,
      skipExisting: true,
    });
  }

  /**
   * Generate shifts for next N days (used by cron job)
   */
  async generateShiftsForNextDays(days: number): Promise<GenerateShiftsResult> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1); // Bắt đầu từ ngày mai
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days - 1);
    endDate.setHours(23, 59, 59, 999);

    this.logger.log(
      `🔄 Generating shifts for next ${days} days (${startDate.toISOString().split('T')[0]} → ${endDate.toISOString().split('T')[0]})`,
    );

    return this.generateShifts({
      startDate,
      endDate,
      skipExisting: true,
    });
  }

  /**
   * Generate shifts for next week (Monday → Sunday)
   * Used by weekly cron job on Sunday night
   */
  async generateShiftsForNextWeek(): Promise<GenerateShiftsResult> {
    // Tìm thứ 2 tuần sau
    const nextMonday = this.getNextMonday();
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextSunday.getDate() + 6); // +6 days = Sunday
    nextSunday.setHours(23, 59, 59, 999);

    this.logger.log(
      `📅 Generating shifts for next week (Mon ${nextMonday.toISOString().split('T')[0]} → Sun ${nextSunday.toISOString().split('T')[0]})`,
    );

    return this.generateShifts({
      startDate: nextMonday,
      endDate: nextSunday,
      skipExisting: true,
    });
  }

  /**
   * Helper: Get next Monday
   */
  private getNextMonday(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday → 1, else 8-dayOfWeek

    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    nextMonday.setHours(0, 0, 0, 0);

    return nextMonday;
  }
}
