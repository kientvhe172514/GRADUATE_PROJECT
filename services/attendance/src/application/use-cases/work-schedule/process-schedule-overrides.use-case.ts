import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IEmployeeWorkScheduleRepository } from '../../ports/work-schedule.repository.port';
import { ShiftGeneratorService } from '../../services/shift-generator.service';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';
import { EmployeeServiceClient } from '../../../infrastructure/external-services/employee-service.client';
import {
  ScheduleOverrideType,
  ScheduleOverrideStatus,
} from '../../dtos/schedule-override.dto';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../tokens';

/**
 * Cron job that runs at 00:00 and 12:00 daily to process pending schedule_overrides
 * It will process overrides for the next day only.
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
  ) {}

  // Run ONLY at 00:00 (midnight) server time to create shifts for the next day
  @Cron('0 0 * * *')
  public async handleCron() {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const dateStr = nextDay.toISOString().split('T')[0];

    this.logger.log(`🕐 [00:00] Processing schedule overrides for date ${dateStr}`);

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
          // Check if shift already exists for this date
          const existingShift = await this.employeeShiftRepository.findByEmployeeAndDate(
            assignment.employee_id,
            new Date(dateStr),
          );

          if (existingShift) {
            // Update existing shift to ON_LEAVE status
            existingShift.status = 'ON_LEAVE';
            await this.employeeShiftRepository.update(existingShift.id, {
              status: 'ON_LEAVE',
              notes: `Leave: ${leave.reason}`,
            });
          } else {
            // Create ON_LEAVE shift placeholder
            await this.employeeShiftRepository.create({
              employee_id: assignment.employee_id,
              employee_code: '', // Will be filled by fetching employee info if needed
              department_id: 0, // Will be filled if needed
              shift_date: new Date(dateStr),
              work_schedule_id: assignment.work_schedule_id,
              scheduled_start_time: '00:00',
              scheduled_end_time: '00:00',
              presence_verification_required: false,
              presence_verification_rounds_required: 0,
            });

            // Update to ON_LEAVE status
            const createdShift = await this.employeeShiftRepository.findByEmployeeAndDate(
              assignment.employee_id,
              new Date(dateStr),
            );
            if (createdShift) {
              createdShift.status = 'ON_LEAVE';
              await this.employeeShiftRepository.update(createdShift.id, {
                status: 'ON_LEAVE',
                notes: `Leave: ${leave.reason}`,
              });
            }
          }

          assignment.mark_override_shift_created(leave.id);
          assignment.update_override_status(leave.id, ScheduleOverrideStatus.COMPLETED);
          await this.employeeWorkScheduleRepo.save(assignment);
        }

        // Schedule changes: create shifts based on override_work_schedule_id
        for (const change of changes) {
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
        for (const ot of otRequests) {
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

    this.logger.log(`Completed processing schedule overrides for date ${dateStr}`);
  }
}
