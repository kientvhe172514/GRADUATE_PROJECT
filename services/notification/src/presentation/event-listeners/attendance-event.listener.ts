import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

@Controller()
export class AttendanceEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly employeeServiceClient: EmployeeServiceClient,
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
        title: 'GPS Check', // ✅ FIX: Cần có title ngắn (không hiển thị vì silent=true)
        message: 'Background GPS sync', // ✅ FIX: Cần có message ngắn
        channels: [ChannelType.PUSH], // Chỉ push, không in-app/email
        metadata: {
          type: 'GPS_CHECK_REQUEST', // Mobile sẽ check field này
          action: 'BACKGROUND_GPS_SYNC',
          shiftId: event.metadata?.shiftId,
          shiftName: event.metadata?.shiftName,
          timestamp: new Date().toISOString(),
          silent: 'true', // ✅ FIX: Phải là string 'true' để Firebase service nhận đúng
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
   * Ghi log để tracking, KHÔNG gửi notification (vì đây là trường hợp bình thường)
   */
  @EventPattern('attendance.location_verified')
  async handleLocationVerified(@Payload() event: any): Promise<void> {
    console.log('✅ [AttendanceEventListener] ===== GPS VERIFIED EVENT RECEIVED =====');
    console.log('✅ [AttendanceEventListener] Event payload:', JSON.stringify(event, null, 2));
    console.log(`✅ [AttendanceEventListener] Employee ${event.employeeId} GPS is valid`);
    console.log(`✅ [AttendanceEventListener] Distance: ${Math.round(event.validation?.distance_from_office_meters || 0)}m from office`);
    
    // NOTE: Không gửi notification cho GPS valid vì đây là trường hợp bình thường
    // Chỉ gửi notification khi GPS INVALID (xem handleLocationOutOfRange)
    
    // OPTIONAL: Nếu muốn gửi notification tích cực, uncomment code sau:
    /*
    try {
      const dto: SendNotificationDto = {
        recipientId: event.employeeId,
        notificationType: NotificationType.SYSTEM_ALERT,
        priority: Priority.LOW,
        title: '✅ GPS xác thực thành công',
        message: 'Vị trí của bạn đã được xác thực trong phạm vi văn phòng.',
        channels: [ChannelType.IN_APP], // Chỉ in-app, không push
        metadata: {
          eventType: 'attendance.location_verified',
          shiftId: event.shiftId,
          distance: Math.round(event.validation?.distance_from_office_meters || 0),
          timestamp: event.timestamp,
        },
      };
      await this.sendNotificationUseCase.execute(dto);
    } catch (error) {
      console.error('❌ Error sending location verified notification:', error);
    }
    */
  }

  /**
   * ✨ GENERIC HANDLER cho bất kỳ notification.send event nào
   * 
   * Flow:
   * 1. Attendance/Leave/Employee service emit 'notification.send' với full payload
   * 2. Notification service nhận và parse payload
   * 3. Gửi notification qua use case
   * 
   * Event payload phải match SendNotificationDto:
   * {
   *   recipientId: number,
   *   notificationType: string,
   *   priority: string,
   *   title: string,
   *   message: string,
   *   channels: ['IN_APP', 'PUSH', 'EMAIL'],
   *   metadata?: object
   * }
   */
  @EventPattern('notification.send')
  async handleGenericNotification(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received notification.send:', event);
    
    try {
      // Validate required fields
      if (!event.recipientId || !event.title || !event.message) {
        console.error('❌ [AttendanceEventListener] Invalid notification payload:', event);
        return;
      }

      // Fetch employee data to get email address (if not provided in event)
      let recipientEmail = event.recipientEmail;
      let recipientName = event.recipientName;
      
      if (!recipientEmail) {
        const employeeInfo = await this.employeeServiceClient.getEmployeeById(event.recipientId);
        if (employeeInfo) {
          recipientEmail = employeeInfo.email;
          recipientName = employeeInfo.full_name;
        } else {
          console.warn(`⚠️  Employee ${event.recipientId} not found, sending notification without email`);
        }
      }

      const dto: SendNotificationDto = {
        recipientId: event.recipientId,
        recipientEmail: recipientEmail,
        recipientName: recipientName,
        notificationType: event.notificationType || NotificationType.SYSTEM_ALERT,
        priority: event.priority || Priority.NORMAL,
        title: event.title,
        message: event.message,
        channels: event.channels || [ChannelType.IN_APP, ChannelType.PUSH],
        metadata: event.metadata || {},
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] Generic notification sent to employee ${event.recipientId}${recipientEmail ? ` (${recipientEmail})` : ''}`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling notification.send:', error);
    }
  }

  // ========== SHIFT ASSIGNMENT EVENTS ==========

  @EventPattern('shift.assigned')
  async handleShiftAssigned(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received shift.assigned:', event);
    
    try {
      // Fetch employee data to get email address
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(event.employeeId);
      
      if (!employeeInfo) {
        console.warn(`⚠️  Employee ${event.employeeId} not found, skipping shift assigned notification`);
        return;
      }

      const dto: SendNotificationDto = {
        recipientId: event.employeeId,
        recipientEmail: employeeInfo.email,
        recipientName: employeeInfo.full_name,
        notificationType: NotificationType.SCHEDULE_CHANGE,
        priority: Priority.HIGH,
        title: '📅 New Shift Assigned',
        message: `You have been assigned to shift "${event.scheduleName}" starting from ${event.effectiveFrom}. Working hours: ${event.startTime} - ${event.endTime}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'shift.assigned',
          scheduleId: event.scheduleId,
          scheduleName: event.scheduleName,
          effectiveFrom: event.effectiveFrom,
          effectiveTo: event.effectiveTo,
          startTime: event.startTime,
          endTime: event.endTime,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] Shift assigned notification sent to employee ${event.employeeId} (${employeeInfo.email})`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling shift.assigned:', error);
    }
  }

  @EventPattern('shift.unassigned')
  async handleShiftUnassigned(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received shift.unassigned:', event);
    
    try {
      // Fetch employee data to get email address
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(event.employeeId);
      
      if (!employeeInfo) {
        console.warn(`⚠️  Employee ${event.employeeId} not found, skipping shift unassigned notification`);
        return;
      }

      const dto: SendNotificationDto = {
        recipientId: event.employeeId,
        recipientEmail: employeeInfo.email,
        recipientName: employeeInfo.full_name,
        notificationType: NotificationType.SCHEDULE_CHANGE,
        priority: Priority.HIGH,
        title: '❌ Shift Assignment Removed',
        message: `Your shift assignment has been removed. ${event.deletedShiftsCount} future shifts have been deleted.`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'shift.unassigned',
          workScheduleId: event.workScheduleId,
          assignmentId: event.assignmentId,
          deletedShiftsCount: event.deletedShiftsCount,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] Shift unassigned notification sent to employee ${event.employeeId} (${employeeInfo.email})`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling shift.unassigned:', error);
    }
  }

  @EventPattern('shift.changed')
  async handleShiftChanged(@Payload() event: any): Promise<void> {
    console.log('📬 [AttendanceEventListener] Received shift.changed:', event);
    
    try {
      // Fetch employee data to get email address
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(event.employeeId);
      
      if (!employeeInfo) {
        console.warn(`⚠️  Employee ${event.employeeId} not found, skipping shift changed notification`);
        return;
      }

      const changeDetails: string[] = [];
      
      if (event.newEffectiveFrom !== event.oldEffectiveFrom) {
        changeDetails.push(`Start date changed to ${event.newEffectiveFrom}`);
      }
      
      if (event.newEffectiveTo !== event.oldEffectiveTo) {
        changeDetails.push(`End date changed to ${event.newEffectiveTo || 'indefinite'}`);
      }

      const dto: SendNotificationDto = {
        recipientId: event.employeeId,
        recipientEmail: employeeInfo.email,
        recipientName: employeeInfo.full_name,
        notificationType: NotificationType.SCHEDULE_CHANGE,
        priority: Priority.MEDIUM,
        title: '⚠️ Shift Assignment Updated',
        message: `Your shift assignment has been updated. ${changeDetails.join(', ')}. ${event.deletedShiftsCount > 0 ? `${event.deletedShiftsCount} future shifts have been deleted.` : ''}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'shift.changed',
          workScheduleId: event.workScheduleId,
          assignmentId: event.assignmentId,
          oldEffectiveFrom: event.oldEffectiveFrom,
          newEffectiveFrom: event.newEffectiveFrom,
          oldEffectiveTo: event.oldEffectiveTo,
          newEffectiveTo: event.newEffectiveTo,
          deletedShiftsCount: event.deletedShiftsCount,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(`✅ [AttendanceEventListener] Shift changed notification sent to employee ${event.employeeId} (${employeeInfo.email})`);
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling shift.changed:', error);
    }
  }

  /**
   * Listen to GPS out of range event
   * Send ALERT notification to employee (PUSH + IN_APP)
   * Send notification to manager (WEB) for monitoring
   */
  @EventPattern('attendance.location_out_of_range')
  async handleLocationOutOfRange(@Payload() event: any): Promise<void> {
    console.log('⚠️ [AttendanceEventListener] ===== GPS OUT OF RANGE EVENT RECEIVED =====');
    console.log('⚠️ [AttendanceEventListener] Event payload:', JSON.stringify(event, null, 2));
    
    try {
      const distance = Math.round(event.validation?.distance_from_office_meters || 0);
      
      // 📱 1. Send notification to EMPLOYEE (PUSH + IN_APP)
      console.log(`⚠️ [AttendanceEventListener] Preparing notification for employee ${event.employeeId}`);
      console.log(`⚠️ [AttendanceEventListener] Distance from office: ${distance}m`);
      
      const employeeDto: SendNotificationDto = {
        recipientId: event.employeeId,
        notificationType: NotificationType.ATTENDANCE_VIOLATION,
        priority: Priority.HIGH,
        title: '⚠️ Location Alert',
        message: `You are outside the office area (${distance}m away). Please return to the work zone immediately!`,
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

      console.log(`⚠️ [AttendanceEventListener] Sending notification to employee:`, JSON.stringify(employeeDto, null, 2));
      await this.sendNotificationUseCase.execute(employeeDto);
      console.log(`✅ [AttendanceEventListener] Location violation alert sent to employee ${event.employeeId}`);

      // 💼 2. Send notification to MANAGER (WEB) if exists
      if (event.managerId) {
        console.log(`💼 [AttendanceEventListener] Preparing notification for manager (employee_id: ${event.managerId})`);
        console.log(`💼 [AttendanceEventListener] Manager: ${event.managerName} | Employee: ${event.employeeName}`);
        
        const managerDto: SendNotificationDto = {
          recipientId: event.managerId, // ✅ Manager's employee_id from employees table
          notificationType: NotificationType.ATTENDANCE_VIOLATION,
          priority: Priority.HIGH,
          title: `⚠️ Employee ${event.employeeName} is Out of Office Area`,
          message: `Employee ${event.employeeName} (${event.employeeCode}) is currently outside the office area (${distance}m away). Department: ${event.departmentName || 'N/A'}. Please check and take action.`,
          channels: [ChannelType.WEB], // ✅ Send via WEB channel only for manager
          metadata: {
            eventType: 'attendance.location_out_of_range',
            shiftId: event.shiftId,
            employeeId: event.employeeId,
            employeeCode: event.employeeCode,
            employeeName: event.employeeName,
            departmentId: event.departmentId,
            departmentName: event.departmentName,
            distance: distance,
            latitude: event.latitude,
            longitude: event.longitude,
            timestamp: event.timestamp,
            notificationTarget: 'MANAGER',
          },
        };

        console.log(`💼 [AttendanceEventListener] Sending notification to manager:`, JSON.stringify(managerDto, null, 2));
        await this.sendNotificationUseCase.execute(managerDto);
        console.log(`✅ [AttendanceEventListener] Location violation alert sent to manager ${event.managerName} (employee_id: ${event.managerId})`);
      } else {
        console.log(`⚠️ [AttendanceEventListener] No manager found for employee ${event.employeeId} - skipping manager notification`);
      }
    } catch (error) {
      console.error('❌ [AttendanceEventListener] Error handling location out of range:', error);
      console.error('❌ [AttendanceEventListener] Error stack:', error.stack);
    }
  }
}
