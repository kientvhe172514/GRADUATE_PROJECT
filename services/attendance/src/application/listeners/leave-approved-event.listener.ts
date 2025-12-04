import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { IEmployeeWorkScheduleRepository } from '../../application/ports/work-schedule.repository.port';
import { EMPLOYEE_WORK_SCHEDULE_REPOSITORY } from '../../application/tokens';
import { ScheduleOverrideType, ScheduleOverrideStatus } from '../../application/dtos/schedule-override.dto';
import { ProcessOnLeaveOverrideService } from '../../application/services/process-on-leave-override.service';

interface LeaveApprovedEventPayload {
  leaveId: number;
  employeeId: number;
  employeeCode: string;
  departmentId: number;
  leaveTypeId: number;
  leaveType: string;
  leaveTypeCode: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalLeaveDays: number;
  approvedBy: number;
  approvedAt: string;
  recipientType: string;
}

/**
 * Listens to leave.approved events from Leave Service
 * Automatically creates ON_LEAVE overrides for approved leave requests
 */
@Injectable()
export class LeaveApprovedEventListener {
  private readonly logger = new Logger(LeaveApprovedEventListener.name);

  constructor(
    @Inject(EMPLOYEE_WORK_SCHEDULE_REPOSITORY)
    private readonly employeeWorkScheduleRepo: IEmployeeWorkScheduleRepository,
    private readonly processOnLeaveService: ProcessOnLeaveOverrideService,
  ) {}

  /**
   * Handle leave.approved event
   * Find employee's work schedule assignment and create ON_LEAVE override
   */
  @EventPattern('leave.approved')
  async handleLeaveApproved(@Payload() payload: LeaveApprovedEventPayload) {
    try {
      this.logger.log(
        `🏖️ Received leave.approved event: Employee ${payload.employeeId} (${payload.employeeCode}) ` +
        `leave from ${payload.startDate} to ${payload.endDate} (${payload.totalLeaveDays} days)`,
      );

      // Find employee's active work schedule assignments
      const assignments = await this.employeeWorkScheduleRepo.findAssignmentsByEmployeeId(
        payload.employeeId,
      );

      if (!assignments || assignments.length === 0) {
        this.logger.warn(
          `⚠️ No work schedule assignment found for employee ${payload.employeeId}. ` +
          `Cannot create ON_LEAVE override. Employee may not be assigned to any schedule yet.`,
        );
        return;
      }

      // Find the assignment that covers the leave period
      // Must check effective_from/effective_to range to select correct assignment
      const leaveStart = new Date(payload.startDate);
      const leaveEnd = new Date(payload.endDate);
      
      const matchingAssignment = assignments.find((a) => {
        const assignStart = a.effective_from ? new Date(a.effective_from) : null;
        const assignEnd = a.effective_to ? new Date(a.effective_to) : null;

        // Assignment must start before or on leave start
        const startValid = !assignStart || assignStart <= leaveStart;
        // Assignment must end after or on leave start (or no end date = indefinite)
        const endValid = !assignEnd || assignEnd >= leaveStart;

        return startValid && endValid;
      });

      if (!matchingAssignment) {
        this.logger.warn(
          `⚠️ No work schedule assignment covers the leave period ${payload.startDate} to ${payload.endDate} ` +
          `for employee ${payload.employeeId}. Cannot create ON_LEAVE override.`,
        );
        return;
      }

      const assignment = matchingAssignment;

      this.logger.debug(
        `Found ${assignments.length} work schedule assignment(s) for employee ${payload.employeeId}. ` +
        `Using assignment ${assignment.id} (work_schedule_id: ${assignment.work_schedule_id}) ` +
        `which covers period ${assignment.effective_from || 'unbounded'} to ${assignment.effective_to || 'unbounded'}`,
      );

      // Check if override already exists for this leave request
      const existingOverrides = assignment.schedule_overrides || [];
      const duplicateOverride = existingOverrides.find(
        (o) =>
          o.type === 'ON_LEAVE' &&
          o.leave_request_id === payload.leaveId,
      );

      if (duplicateOverride) {
        this.logger.warn(
          `Override already exists for leave request ${payload.leaveId}, skipping`,
        );
        return;
      }

      // Create ON_LEAVE override
      assignment.add_schedule_override({
        type: ScheduleOverrideType.ON_LEAVE,
        from_date: payload.startDate,
        to_date: payload.endDate,
        leave_request_id: payload.leaveId,
        reason: `${payload.leaveType}: Approved leave`,
        created_by: payload.approvedBy,
      });

      // Save assignment with new override
      await this.employeeWorkScheduleRepo.save(assignment);

      this.logger.log(
        `✅ Created ON_LEAVE override for employee ${payload.employeeId} ` +
        `(${payload.startDate} to ${payload.endDate})`,
      );

      // Process ON_LEAVE override immediately (synchronous)
      // This will create/update shifts to ON_LEAVE status right away
      const overrides = assignment.schedule_overrides || [];
      const newOverride = overrides[overrides.length - 1]; // Latest added

      if (newOverride) {
        this.logger.log(
          `🔄 Processing ON_LEAVE override immediately (synchronous)`,
        );

        // Process each date in the range
        const fromDate = new Date(payload.startDate);
        const toDate = new Date(payload.endDate);
        const currentDate = new Date(fromDate);
        let hasError = false;
        let errorMessage = '';

        while (currentDate <= toDate) {
          const dateStr = currentDate.toISOString().split('T')[0];

          try {
            await this.processOnLeaveService.processOnLeaveOverride(
              newOverride,
              assignment.employee_id,
              assignment.work_schedule_id,
              dateStr,
            );

            this.logger.debug(
              `✅ Processed ON_LEAVE for employee ${payload.employeeId} on ${dateStr}`,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process ON_LEAVE override for date ${dateStr}`,
              error,
            );
            hasError = true;
            errorMessage = (error as Error).message || 'Failed to process override';
            // Don't break - continue processing remaining dates
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Mark override status AFTER processing all dates
        if (hasError) {
          assignment.update_override_status(
            newOverride.id,
            ScheduleOverrideStatus.FAILED,
            errorMessage,
          );
        } else {
          assignment.mark_override_shift_created(newOverride.id);
          assignment.update_override_status(
            newOverride.id,
            ScheduleOverrideStatus.COMPLETED,
          );
        }

        // Save the updated assignment with override status
        await this.employeeWorkScheduleRepo.save(assignment);

        this.logger.log(
          `✅ Completed ON_LEAVE override processing for employee ${payload.employeeId}: ` +
          `${hasError ? 'FAILED' : 'COMPLETED'}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process leave.approved event for employee ${payload.employeeId}`,
        error,
      );
    }
  }
}
