import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IEmployeeShiftRepository } from '../ports/employee-shift.repository.port';
import { PresenceVerificationRepositoryPort } from '../ports/presence-verification.repository.port';
import { IEventPublisher } from '../ports/event-publisher.port';

/**
 * Use Case: Schedule Verification Reminders (Cron Job)
 * 
 * Business Logic:
 * 1. Runs every 5 minutes
 * 2. Find all active shifts (status = IN_PROGRESS)
 * 3. For each shift, calculate which round should be done now
 * 4. Check if round is not yet completed
 * 5. Check if round is due (scheduled time ± 15 minutes)
 * 6. Publish reminder event to send push notification
 * 
 * Reminder Window: 15 minutes before and 15 minutes after scheduled time
 */
@Injectable()
export class ScheduleVerificationRemindersUseCase {
  private readonly logger = new Logger(ScheduleVerificationRemindersUseCase.name);

  constructor(
    @Inject('IEmployeeShiftRepository')
    private readonly employeeShiftRepository: IEmployeeShiftRepository,
    @Inject('IPresenceVerificationRepository')
    private readonly presenceVerificationRepository: PresenceVerificationRepositoryPort,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Cron job: runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async execute(): Promise<void> {
    this.logger.log('Starting verification reminders check...');

    try {
      // 1. Find all active shifts
      const activeShifts = await this.employeeShiftRepository.findByStatus('IN_PROGRESS');

      this.logger.log(`Found ${activeShifts.length} active shifts`);

      let remindersSent = 0;

      // 2. Process each shift
      for (const shift of activeShifts) {
        const sent = await this.processShift(shift);
        remindersSent += sent;
      }

      this.logger.log(`Sent ${remindersSent} verification reminders`);
    } catch (error) {
      this.logger.error('Error processing verification reminders', error);
    }
  }

  /**
   * Process a single shift and send reminders if needed
   */
  private async processShift(shift: any): Promise<number> {
    let remindersSent = 0;

    // Calculate verification schedule
    const rounds = this.calculateVerificationRounds(
      shift.checkin_time,
      shift.expected_checkout_time,
    );

    // Check each round
    for (let i = 0; i < rounds.length; i++) {
      const roundNumber = i + 1;
      const scheduledTime = rounds[i];

      // Check if round is due (within 15 minutes window)
      if (!this.isWithinReminderWindow(scheduledTime)) {
        continue;
      }

      // Check if round is already completed
      const existingVerification = await this.presenceVerificationRepository.findByShiftIdAndRoundNumber(
        shift.id,
        roundNumber,
      );

      if (existingVerification) {
        continue; // Already completed
      }

      // Send reminder
      await this.sendReminder(shift, roundNumber, scheduledTime);
      remindersSent++;
    }

    return remindersSent;
  }

  /**
   * Calculate 3 verification rounds at 25%, 50%, 75% of shift duration
   */
  private calculateVerificationRounds(
    checkinTime: Date,
    expectedCheckoutTime: Date,
  ): Date[] {
    const shiftDurationMs =
      expectedCheckoutTime.getTime() - checkinTime.getTime();

    const round1Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.25,
    );
    const round2Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.5,
    );
    const round3Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.75,
    );

    return [round1Time, round2Time, round3Time];
  }

  /**
   * Check if current time is within reminder window (±15 minutes)
   */
  private isWithinReminderWindow(scheduledTime: Date): boolean {
    const now = new Date();
    const fifteenMinutesMs = 15 * 60 * 1000;

    const windowStart = new Date(scheduledTime.getTime() - fifteenMinutesMs);
    const windowEnd = new Date(scheduledTime.getTime() + fifteenMinutesMs);

    return now >= windowStart && now <= windowEnd;
  }

  /**
   * Send reminder notification via event
   */
  private async sendReminder(
    shift: any,
    roundNumber: number,
    scheduledTime: Date,
  ): Promise<void> {
    await this.eventPublisher.publish({
      pattern: 'presence.verification.reminder',
      data: {
        employee_id: shift.employee_id,
        shift_id: shift.id,
        round_number: roundNumber,
        scheduled_time: scheduledTime,
        message: `Nhắc nhở: Vui lòng xác minh vị trí làm việc (Lượt ${roundNumber}/3)`,
      },
    });

    this.logger.log(
      `Sent reminder to employee ${shift.employee_id} for shift ${shift.id}, round ${roundNumber}`,
    );
  }
}
