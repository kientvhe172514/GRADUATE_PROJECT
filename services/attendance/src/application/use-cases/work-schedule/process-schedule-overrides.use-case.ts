import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { ShiftGeneratorService } from '../../services/shift-generator.service';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { EmployeeServiceClient } from '../../../infrastructure/external-services/employee-service.client';
import { HolidayServiceClient } from '../../../infrastructure/external-services/holiday-service.client';
import {
  ScheduleOverrideType,
  ScheduleOverrideStatus,
} from '../../dtos/schedule-override.dto';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';
import { ProcessOnLeaveOverrideService } from '../../services/process-on-leave-override.service';

/**
 * Cron job that runs at 00:00 daily to process pending schedule_overrides
 * It will process overrides for the next day only.
 * Also checks holidays and skips shift creation on company holidays.
 */
@Injectable()
export class ProcessScheduleOverridesUseCase {
  private readonly logger = new Logger(ProcessScheduleOverridesUseCase.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
    private readonly shiftGeneratorService: ShiftGeneratorService,
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
    private readonly processOnLeaveService: ProcessOnLeaveOverrideService,
    private readonly holidayServiceClient: HolidayServiceClient,
  ) {}

  // Run ONLY at 00:00 (midnight) server time to create shifts for the next day
  @Cron('0 0 * * *')
  public async handleCron() {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const dateStr = nextDay.toISOString().split('T')[0];

    this.logger.log(`🕐 [00:00] Processing shifts and overrides for date ${dateStr}`);

    // Check if next day is a holiday (company-wide check)
    const isHoliday = await this.holidayServiceClient.isHoliday(dateStr);
    if (isHoliday) {
      this.logger.log(`🏖️ ${dateStr} is a holiday - skipping regular shift creation`);
    }

    // STEP 1: Process pending overrides FIRST (ON_LEAVE, SCHEDULE_CHANGE, OVERTIME)
    // These will create shifts based on override rules
    this.logger.log(`🔄 Processing schedule overrides for ${dateStr}`);
    const assignments = await this.employeeWorkScheduleRepo.findPendingOverridesForDate(dateStr);

    for (const assignment of assignments) {
      try {
        const pending = assignment.get_pending_overrides_for_date(dateStr);

        // Process in order: ON_LEAVE > SCHEDULE_CHANGE > OVERTIME
        const leaveRequests = pending.filter((o) => o.type === ScheduleOverrideType.ON_LEAVE);
        const changes = pending.filter((o) => o.type === ScheduleOverrideType.SCHEDULE_CHANGE);
        const otRequests = pending.filter((o) => o.type === ScheduleOverrideType.OVERTIME);

        // ON_LEAVE: Mark shift as ON_LEAVE (no work shift created)
        for (const leave of leaveRequests) {
          try {
            await this.processOnLeaveService.processOnLeaveOverride(
              leave,
              assignment.employee_id,
              assignment.work_schedule_id,
              dateStr,
            );

            assignment.mark_override_shift_created(leave.id);
            assignment.update_override_status(leave.id, ScheduleOverrideStatus.COMPLETED);
            await this.employeeWorkScheduleRepo.save(assignment);
          } catch (error) {
            this.logger.error(
              `Failed to process ON_LEAVE override ${leave.id} for date ${dateStr}`,
              error,
            );
            assignment.update_override_status(
              leave.id,
              ScheduleOverrideStatus.FAILED,
              (error as any).message || 'Failed to process ON_LEAVE',
            );
            await this.employeeWorkScheduleRepo.save(assignment);
          }
        }

        // Schedule changes: create shifts based on override_work_schedule_id
        // If it's a holiday, leave PENDING for retry when holiday is removed
        for (const change of changes) {
          if (isHoliday) {
            this.logger.log(
              `Skipping SCHEDULE_CHANGE override ${change.id} - ${dateStr} is a holiday (will retry later)`,
            );
            // Keep PENDING status instead of marking FAILED
            // This allows retry when holiday is removed or on next non-holiday
            continue;
          }

          // Load the new work schedule from DB via repository (via shift creation helper)
          if (!change.override_work_schedule_id) {
            assignment.update_override_status(change.id, ScheduleOverrideStatus.FAILED, 'Missing override_work_schedule_id');
            await this.employeeWorkScheduleRepo.save(assignment);
            continue;
          }

          // Create regular shift(s) for the next day using shift generator
          const startDate = new Date(dateStr);
          const endDate = new Date(dateStr);
          await this.shiftGeneratorService.generateShifts({
            employeeId: assignment.employee_id,
            startDate,
            endDate,
            skipExisting: true,
          });

          assignment.mark_override_shift_created(change.id);
          assignment.update_override_status(change.id, ScheduleOverrideStatus.COMPLETED);
          await this.employeeWorkScheduleRepo.save(assignment);
        }

        // Overtime: create overtime shifts with provided time ranges
        // Skip if it's a holiday (no overtime on holidays)
        for (const ot of otRequests) {
          if (isHoliday) {
            this.logger.log(
              `Skipping OVERTIME override ${ot.id} - ${dateStr} is a holiday`,
            );
            assignment.update_override_status(
              ot.id,
              ScheduleOverrideStatus.FAILED,
              'Cannot create overtime shift on holiday',
            );
            await this.employeeWorkScheduleRepo.save(assignment);
            continue;
          }

          if (!ot.overtime_start_time || !ot.overtime_end_time) {
            assignment.update_override_status(ot.id, ScheduleOverrideStatus.FAILED, 'Missing overtime time range');
            await this.employeeWorkScheduleRepo.save(assignment);
            continue;
          }

          // Create overtime shift manually
          const employeeInfo = await this.employeeServiceClient.getEmployeeById(
            assignment.employee_id,
          );
          if (!employeeInfo) {
            assignment.update_override_status(
              ot.id,
              ScheduleOverrideStatus.FAILED,
              'Employee not found',
            );
            await this.employeeWorkScheduleRepo.save(assignment);
            continue;
          }

          if (!employeeInfo.department_id) {
            assignment.update_override_status(
              ot.id,
              ScheduleOverrideStatus.FAILED,
              'Employee missing department',
            );
            await this.employeeWorkScheduleRepo.save(assignment);
            continue;
          }

          await this.employeeShiftRepository.create({
            employee_id: assignment.employee_id,
            employee_code: employeeInfo.employee_code,
            department_id: employeeInfo.department_id,
            shift_date: new Date(dateStr),
            work_schedule_id: assignment.work_schedule_id,
            scheduled_start_time: ot.overtime_start_time,
            scheduled_end_time: ot.overtime_end_time,
            shift_type: 'OVERTIME',
            presence_verification_required: false,
            presence_verification_rounds_required: 0,
          });

          assignment.mark_override_shift_created(ot.id);
          assignment.update_override_status(ot.id, ScheduleOverrideStatus.COMPLETED);
          await this.employeeWorkScheduleRepo.save(assignment);
        }
      } catch (err) {
        this.logger.error('Failed processing overrides for assignment ' + assignment.id, err as any);
        // Mark all pending overrides of assignment as FAILED with error message
        const pending = assignment.get_pending_overrides_for_date(dateStr);
        for (const p of pending) {
          assignment.update_override_status(p.id, ScheduleOverrideStatus.FAILED, (err as any).message || 'Unknown error');
        }
        await this.employeeWorkScheduleRepo.save(assignment);
      }
    }

    // STEP 2: Generate regular shifts for employees WITHOUT overrides
    // Only if it's not a holiday
    if (!isHoliday) {
      this.logger.log(`📅 Generating regular shifts for employees without overrides on ${dateStr}`);
      
      try {
        // Get employee IDs that already have overrides processed
        const employeeIdsWithOverrides = new Set(assignments.map(a => a.employee_id));
        
        // Generate shifts for all employees, excluding those with overrides
        // The generator will skip employees with overrides automatically via skipExisting
        const result = await this.shiftGeneratorService.generateShifts({
          startDate: new Date(dateStr),
          endDate: new Date(dateStr),
          skipExisting: true, // Skip employees who already have shifts (from overrides)
        });
        
        this.logger.log(
          `✅ Regular shift generation completed: ${result.shiftsCreated} created, ` +
          `${result.shiftsSkipped} skipped (overrides or existing), ${result.errors.length} errors`,
        );
      } catch (error) {
        this.logger.error(`Failed to generate regular shifts for ${dateStr}`, error);
      }
    }

    this.logger.log(`Completed processing schedule overrides for date ${dateStr}`);
  }
}
