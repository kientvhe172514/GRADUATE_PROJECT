import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

@Controller()
export class LeaveEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  @EventPattern('leave.requested')
  async handleLeaveRequested(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.requested:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.LEAVE_REQUEST_SUBMITTED,
        priority: Priority.MEDIUM,
        title: 'Leave Request Submitted',
        message: `Your leave request for ${event.leaveType} has been submitted and is pending approval.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'leave.requested',
          leaveId: event.leaveId,
          leaveType: event.leaveType,
          startDate: event.startDate,
          endDate: event.endDate,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [LeaveEventListener] Leave request notification sent successfully');
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.requested:', error);
    }
  }

  @EventPattern('leave.approved')
  async handleLeaveApproved(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.approved:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.LEAVE_REQUEST_APPROVED,
        priority: Priority.HIGH,
        title: '✅ Leave Request Approved',
        message: `Your leave request for ${event.leaveType} from ${event.startDate} to ${event.endDate} has been approved!`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'leave.approved',
          leaveId: event.leaveId,
          leaveType: event.leaveType,
          startDate: event.startDate,
          endDate: event.endDate,
          approvedBy: event.approvedBy,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [LeaveEventListener] Leave approval notification sent successfully');
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.approved:', error);
    }
  }

  @EventPattern('leave.rejected')
  async handleLeaveRejected(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.rejected:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.LEAVE_REQUEST_REJECTED,
        priority: Priority.HIGH,
        title: '❌ Leave Request Rejected',
        message: `Your leave request for ${event.leaveType} has been rejected. Reason: ${event.reason || 'N/A'}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'leave.rejected',
          leaveId: event.leaveId,
          leaveType: event.leaveType,
          reason: event.reason,
          rejectedBy: event.rejectedBy,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [LeaveEventListener] Leave rejection notification sent successfully');
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.rejected:', error);
    }
  }

  @EventPattern('leave.cancelled')
  async handleLeaveCancelled(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.cancelled:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.LEAVE_REQUEST_UPDATED,
        priority: Priority.MEDIUM,
        title: 'Leave Request Cancelled',
        message: `Your leave request for ${event.leaveType} has been cancelled.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'leave.cancelled',
          leaveId: event.leaveId,
          leaveType: event.leaveType,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [LeaveEventListener] Leave cancellation notification sent successfully');
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.cancelled:', error);
    }
  }
}
