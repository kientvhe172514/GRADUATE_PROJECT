import { Injectable, Logger } from '@nestjs/common';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';
import { ScheduleOverride } from '../../domain/entities/employee-work-schedule.entity';

/**
 * Shared service to process ON_LEAVE overrides
 * Can be called synchronously (when leave approved) or from cron
 */
@Injectable()
export class ProcessOnLeaveOverrideService {
  private readonly logger = new Logger(ProcessOnLeaveOverrideService.name);

  constructor(
    private readonly employeeShiftRepository: EmployeeShiftRepository,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  /**
   * Process a single ON_LEAVE override
   * Creates or updates shift to ON_LEAVE status
   * 
   * @param override - The ON_LEAVE override to process
   * @param employeeId - Employee ID
   * @param workScheduleId - Work schedule ID
   * @param dateStr - Date string in YYYY-MM-DD format
   * @returns Promise<void>
   */
  async processOnLeaveOverride(
    override: ScheduleOverride,
    employeeId: number,
    workScheduleId: number,
    dateStr: string,
  ): Promise<void> {
    this.logger.log(
      `🏖️ Processing ON_LEAVE override for employee ${employeeId} on ${dateStr}`,
    );

    // Check if shift already exists for this date
    const existingShift = await this.employeeShiftRepository.findByEmployeeAndDate(
      employeeId,
      new Date(dateStr),
    );

    if (existingShift) {
      // Update existing shift to ON_LEAVE status
      this.logger.debug(
        `Updating existing shift ${existingShift.id} to ON_LEAVE status`,
      );
      await this.employeeShiftRepository.update(existingShift.id, {
        status: 'ON_LEAVE',
        notes: `Leave: ${override.reason || 'Approved leave'}`,
      });
    } else {
      // Need to create placeholder shift first
      this.logger.debug(
        `Creating ON_LEAVE placeholder shift for employee ${employeeId}`,
      );

      // Fetch employee info to populate required fields
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(
        employeeId,
      );

      if (!employeeInfo) {
        throw new Error(`Employee ${employeeId} not found`);
      }

      if (!employeeInfo.department_id) {
        throw new Error(`Employee ${employeeId} missing department`);
      }

      // Create ON_LEAVE shift placeholder
      const createdShift = await this.employeeShiftRepository.create({
        employee_id: employeeId,
        employee_code: employeeInfo.employee_code,
        department_id: employeeInfo.department_id,
        shift_date: new Date(dateStr),
        work_schedule_id: workScheduleId,
        scheduled_start_time: '00:00',
        scheduled_end_time: '00:00',
        status: 'ON_LEAVE',
        presence_verification_required: false,
        presence_verification_rounds_required: 0,
        notes: `Leave: ${override.reason || 'Approved leave'}`,
      });

      this.logger.debug(
        `Created ON_LEAVE shift ${createdShift.id} for employee ${employeeId}`,
      );
    }

    this.logger.log(
      `✅ Successfully processed ON_LEAVE override for employee ${employeeId} on ${dateStr}`,
    );
  }
}
