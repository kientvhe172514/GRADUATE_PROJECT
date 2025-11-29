import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
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
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async execute(): Promise<void> {
    this.logger.log('Running scheduled verification reminders check');

    try {
      // Get active shifts that need verification
      const activeShifts =
        await this.employeeShiftRepository.findActiveShifts();

      for (const shift of activeShifts) {
        if (!shift.id) continue;

        // Check if verification is pending for this shift
        const verifications = await this.verificationRepository.findByShiftId(
          shift.id,
        );

        // Logic to determine if reminder is needed
        // This can be expanded based on business requirements
        if (verifications.length < 3) {
          this.logger.log(`Shift ${shift.id} needs verification reminder`);

          // ✅ Send reminder notification
          this.sendVerificationReminder(shift, verifications.length);
        }
      }
    } catch (error) {
      this.logger.error('Error executing verification reminders', error);
    }
  }

  /**
   * Gửi reminder notification cho employee cần verification
   */
  private sendVerificationReminder(shift: any, completedRounds: number): void {
    const payload = {
      recipientId: shift.employeeId,
      notificationType: 'PRESENCE_VERIFICATION_REMINDER',
      priority: 'HIGH',
      title: '📍 Nhắc nhở xác thực hiện diện',
      message: `Bạn cần thực hiện xác thực hiện diện cho ca làm việc. Đã hoàn thành ${completedRounds}/3 lượt.`,
      channels: ['PUSH', 'IN_APP'],
      metadata: {
        shiftId: shift.id,
        completedRounds,
        requiredRounds: 3,
        action: 'OPEN_VERIFICATION_SCREEN',
      },
    };

    this.notificationClient.emit('notification.send', payload);
    this.logger.log(
      `Verification reminder sent to employee ${shift.employeeId} for shift ${shift.id}`,
    );
  }
}
