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

  /**
   * Lắng nghe GPS Check Request từ Attendance Service
   * 
   * Flow:
   * 1. Attendance cron gửi event 'notification.request_gps_check'
   * 2. Notification service nhận event
   * 3. Gửi SILENT DATA MESSAGE qua FCM (không show notification)
   * 4. Mobile background service wake up
   * 5. Mobile tự động lấy GPS và gửi lên server
   * 
   * Event payload:
   * {
   *   type: 'GPS_CHECK_REQUEST',
   *   recipientId: 123,
   *   metadata: {
   *     shiftId: 456,
   *     shiftName: 'Ca Sáng',
   *     action: 'BACKGROUND_GPS_SYNC'
   *   }
   * }
   */
  @EventPattern('notification.request_gps_check')
  async handleGpsCheckRequest(@Payload() event: any): Promise<void> {
    console.log('📍 [AttendanceEventListener] Received GPS check request:', event);
    
    try {
      // Gửi silent data message để wake mobile background service
      // Type = DATA (không phải NOTIFICATION) để không hiện popup
      const dto: SendNotificationDto = {
        recipientId: event.recipientId,
        notificationType: NotificationType.SYSTEM_ALERT, // Internal type
        priority: Priority.HIGH,
        title: '', // Empty = silent push
        message: '', // Empty = silent push
        channels: [ChannelType.PUSH], // Chỉ push, không in-app/email
        metadata: {
          type: 'GPS_CHECK_REQUEST', // Mobile sẽ check field này
          action: 'BACKGROUND_GPS_SYNC',
          shiftId: event.metadata?.shiftId,
          shiftName: event.metadata?.shiftName,
          timestamp: new Date().toISOString(),
          silent: true, // Flag để FCM service biết gửi data-only message
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] GPS check request sent to employee ${event.recipientId}`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling GPS check request:', error);
    }
  }

  /**
   * Lắng nghe event khi GPS valid (trong phạm vi)
   */
  @EventPattern('attendance.location_verified')
  async handleLocationVerified(@Payload() event: any): Promise<void> {
    console.log('✅ [AttendanceEventListener] Location verified:', event);
    // Có thể log hoặc gửi thông báo tích cực nếu cần
  }

  /**
   * Lắng nghe event khi GPS invalid (ngoài phạm vi)
   * Gửi ALERT notification để nhân viên biết
   */
  @EventPattern('attendance.location_out_of_range')
  async handleLocationOutOfRange(@Payload() event: any): Promise<void> {
    console.log('⚠️ [AttendanceEventListener] Location out of range:', event);
    
    try {
      const distance = Math.round(event.validation?.distance_from_office_meters || 0);
      
      const dto: SendNotificationDto = {
        recipientId: event.employeeId,
        notificationType: NotificationType.ATTENDANCE_VIOLATION,
        priority: Priority.HIGH,
        title: '⚠️ Cảnh báo vị trí',
        message: `Bạn đang ở ngoài phạm vi văn phòng (${distance}m). Vui lòng di chuyển về khu vực làm việc!`,
        channels: [ChannelType.PUSH, ChannelType.IN_APP],
        metadata: {
          eventType: 'attendance.location_out_of_range',
          shiftId: event.shiftId,
          distance: distance,
          latitude: event.latitude,
          longitude: event.longitude,
          timestamp: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] Location violation alert sent to employee ${event.employeeId}`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling location out of range:', error);
    }
  }
}
