import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

@Controller()
export class AttendanceEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  @EventPattern('attendance.checked-in')
  async handleCheckedIn(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received attendance.checked-in:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.ATTENDANCE_REMINDER,
        priority: Priority.LOW,
        title: 'Check-in Successful',
        message: `You checked in at ${event.checkInTime || new Date().toLocaleTimeString()}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH],
        metadata: {
          eventType: 'attendance.checked-in',
          checkInTime: event.checkInTime,
          location: event.location,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AttendanceEventListener] Check-in notification sent successfully');
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling attendance.checked-in:', error);
    }
  }

  @EventPattern('attendance.checked-out')
  async handleCheckedOut(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received attendance.checked-out:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.ATTENDANCE_REMINDER,
        priority: Priority.LOW,
        title: 'Check-out Successful',
        message: `You checked out at ${event.checkOutTime || new Date().toLocaleTimeString()}`,
        channels: [ChannelType.IN_APP],
        metadata: {
          eventType: 'attendance.checked-out',
          checkOutTime: event.checkOutTime,
          totalHours: event.totalHours,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AttendanceEventListener] Check-out notification sent successfully');
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling attendance.checked-out:', error);
    }
  }

  @EventPattern('attendance.late')
  async handleLate(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received attendance.late:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.ATTENDANCE_LATE_WARNING,
        priority: Priority.MEDIUM,
        title: 'Late Arrival Alert',
        message: `You arrived late today. Check-in time: ${event.checkInTime}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'attendance.late',
          checkInTime: event.checkInTime,
          minutesLate: event.minutesLate,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AttendanceEventListener] Late arrival notification sent successfully');
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling attendance.late:', error);
    }
  }
}
