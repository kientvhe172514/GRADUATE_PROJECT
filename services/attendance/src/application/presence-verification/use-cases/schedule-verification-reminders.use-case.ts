import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PresenceVerificationRepositoryPort } from '../../ports/presence-verification.repository.port';
import { IEmployeeShiftRepository } from '../../ports/employee-shift.repository.port';

@Injectable()
export class ScheduleVerificationRemindersUseCase {
  private readonly logger = new Logger(
    ScheduleVerificationRemindersUseCase.name,
  );

  constructor(
    @Inject('IPresenceVerificationRepository')
    private readonly verificationRepository: PresenceVerificationRepositoryPort,
    @Inject('IEmployeeShiftRepository')
    private readonly employeeShiftRepository: IEmployeeShiftRepository,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async execute(): Promise<void> {
    this.logger.log('Running scheduled verification reminders check');

    try {
      // Get active shifts that need verification
      const activeShifts = await this.employeeShiftRepository.findActiveShifts();

      for (const shift of activeShifts) {
        if (!shift.id) continue;

        // Check if verification is pending for this shift
        const verifications =
          await this.verificationRepository.findByShiftId(shift.id);

        // Logic to determine if reminder is needed
        // This can be expanded based on business requirements
        if (verifications.length < 3) {
          this.logger.log(`Shift ${shift.id} needs verification reminder`);
          // TODO: Send reminder notification
        }
      }
    } catch (error) {
      this.logger.error('Error executing verification reminders', error);
    }
  }
}
