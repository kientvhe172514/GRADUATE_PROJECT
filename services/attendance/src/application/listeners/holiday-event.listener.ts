import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmployeeShiftRepository } from '../../infrastructure/repositories/employee-shift.repository';
import { ShiftStatus } from '../../domain/entities/employee-shift.entity';

interface HolidayEventPayload {
  id: number;
  holiday_name: string;
  holiday_date: string; // YYYY-MM-DD
  holiday_type: string;
  applies_to: string; // 'ALL' | 'DEPARTMENT' | 'LOCATION'
  department_ids?: string; // comma-separated
  location_ids?: string;
  is_paid: boolean;
  status: string; // 'ACTIVE' | 'INACTIVE'
}

/**
 * Listens to holiday events from Leave Service
 * When a holiday is created/updated, update or delete existing shifts
 */
@Injectable()
export class HolidayEventListener {
  private readonly logger = new Logger(HolidayEventListener.name);

  constructor(
    private readonly employeeShiftRepository: EmployeeShiftRepository,
  ) {}

  /**
   * Handle holiday.created event
   * When a new holiday is added, mark/delete existing shifts for that date
   */
  @EventPattern('holiday.created')
  async handleHolidayCreated(@Payload() payload: HolidayEventPayload) {
    try {
      this.logger.log(
        `🗓️ Received holiday.created event: ${payload.holiday_name} on ${payload.holiday_date}`,
      );

      // Only process ACTIVE holidays
      if (payload.status !== 'ACTIVE') {
        this.logger.debug(`Holiday ${payload.id} is not ACTIVE, skipping`);
        return;
      }

      await this.processHolidayForExistingShifts(payload);
    } catch (error) {
      this.logger.error(`Failed to process holiday.created event`, error);
    }
  }

  /**
   * Handle holiday.updated event
   * When a holiday is updated (e.g., date changed, status changed), adjust shifts
   */
  @EventPattern('holiday.updated')
  async handleHolidayUpdated(@Payload() payload: HolidayEventPayload) {
    try {
      this.logger.log(
        `🗓️ Received holiday.updated event: ${payload.holiday_name} on ${payload.holiday_date}`,
      );

      await this.processHolidayForExistingShifts(payload);
    } catch (error) {
      this.logger.error(`Failed to process holiday.updated event`, error);
    }
  }

  /**
   * Handle holiday.deleted event
   * When a holiday is deleted, we don't need to do anything
   * (shifts were already not created because of holiday check in cron)
   */
  @EventPattern('holiday.deleted')
  async handleHolidayDeleted(@Payload() payload: { id: number; holiday_date: string }) {
    try {
      this.logger.log(
        `🗓️ Received holiday.deleted event for date ${payload.holiday_date}`,
      );
      // No action needed - future shifts will be created normally by cron
      this.logger.debug(
        `Holiday deleted - no action needed. Future shifts will be created by cron.`,
      );
    } catch (error) {
      this.logger.error(`Failed to process holiday.deleted event`, error);
    }
  }

  /**
   * Process holiday for existing shifts
   * - If holiday is ACTIVE: mark shifts as HOLIDAY or delete them
   * - If holiday is INACTIVE: no action needed (shifts can remain)
   */
  private async processHolidayForExistingShifts(
    holiday: HolidayEventPayload,
  ): Promise<void> {
    const holidayDate = new Date(holiday.holiday_date);

    // Find all shifts for this date
    const shifts = await this.employeeShiftRepository.findByDateRange(
      holidayDate,
      holidayDate,
    );

    if (shifts.length === 0) {
      this.logger.debug(
        `No existing shifts found for ${holiday.holiday_date}, nothing to update`,
      );
      return;
    }

    this.logger.log(
      `Found ${shifts.length} existing shift(s) for ${holiday.holiday_date}`,
    );

    // Process based on holiday status
    if (holiday.status === 'ACTIVE') {
      // Holiday is active - update shifts
      for (const shift of shifts) {
        // Skip shifts that are already ON_LEAVE (employee took leave)
        if (shift.status === ShiftStatus.ON_LEAVE.valueOf()) {
          this.logger.debug(
            `Shift ${shift.id} is already ON_LEAVE, skipping holiday update`,
          );
          continue;
        }

        // Filter by department if holiday applies to specific departments
        if (
          holiday.applies_to === 'DEPARTMENT' &&
          holiday.department_ids
        ) {
          const deptIds = holiday.department_ids
            .split(',')
            .map((id) => parseInt(id.trim()));
          if (!deptIds.includes(shift.department_id)) {
            this.logger.debug(
              `Shift ${shift.id} department ${shift.department_id} not in holiday dept list, skipping`,
            );
            continue;
          }
        }

        // Update shift status to HOLIDAY
        await this.employeeShiftRepository.update(shift.id, {
          status: ShiftStatus.HOLIDAY.valueOf(),
          notes: `Holiday: ${holiday.holiday_name}`,
        });

        this.logger.log(
          `✅ Updated shift ${shift.id} to HOLIDAY status for ${holiday.holiday_name}`,
        );
      }
    } else if (holiday.status === 'INACTIVE') {
      // Holiday deactivated - optionally revert shifts back to SCHEDULED
      // (This is optional - you may want to keep them as HOLIDAY)
      this.logger.debug(
        `Holiday ${holiday.id} is INACTIVE - no changes to existing shifts`,
      );
    }
  }
}
