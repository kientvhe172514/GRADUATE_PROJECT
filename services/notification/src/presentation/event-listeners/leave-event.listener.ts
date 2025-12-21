import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

@Controller()
export class LeaveEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  @EventPattern('leave.requested')
  async handleLeaveRequested(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.requested:', event);
    try {
      // Determine recipients based on recipientType
      let recipientIds: number[] = [];

      if (event.recipientType === 'MANAGER') {
        // Get managers (HR_MANAGER or DEPARTMENT_MANAGER) for the department
        if (event.departmentId) {
          const departmentManagers = await this.employeeServiceClient.getManagersForDepartment(
            event.departmentId,
          );
          recipientIds = departmentManagers;
        }

        // Also include all HR managers
        const hrManagers = await this.employeeServiceClient.getAllHRManagers();
        recipientIds = [...new Set([...recipientIds, ...hrManagers])]; // Remove duplicates

        if (recipientIds.length === 0) {
          console.warn(
            `⚠️ [LeaveEventListener] No managers found for department ${event.departmentId}`,
          );
          return;
        }
      } else {
        // Default: send to employee
        recipientIds = [event.employeeId]; //  Use employeeId only
      }

      // Send notification to all recipients
      const notificationPromises = recipientIds.map((recipientId) => {
        const employeeInfo = event.recipientType === 'MANAGER'
          ? { employeeCode: event.employeeCode, employeeName: event.employeeName }
          : null;

        const dto: SendNotificationDto = {
          recipientId,
          recipientEmail: event.recipientEmail,
          recipientName: event.recipientName,
          notificationType: NotificationType.LEAVE_REQUEST_SUBMITTED,
          priority: Priority.MEDIUM,
          title:
            event.recipientType === 'MANAGER'
              ? `📋 New Leave Request from ${event.employeeCode || 'Employee'}`
              : 'Leave Request Submitted',
          message:
            event.recipientType === 'MANAGER'
              ? `Employee ${event.employeeCode || event.employeeId} has submitted a leave request for ${event.leaveType || 'leave'} from ${event.startDate} to ${event.endDate}. Please review and approve.`
              : `Your leave request for ${event.leaveType || 'leave'} has been submitted and is pending approval.`,
          channels: [ChannelType.IN_APP, ChannelType.EMAIL],
          metadata: {
            eventType: 'leave.requested',
            leaveId: event.leaveId,
            leaveType: event.leaveType,
            startDate: event.startDate,
            endDate: event.endDate,
            employeeId: event.employeeId,
            employeeCode: event.employeeCode,
            departmentId: event.departmentId,
          },
        };

        return this.sendNotificationUseCase.execute(dto);
      });

      await Promise.all(notificationPromises);
      console.log(
        `✅ [LeaveEventListener] Leave request notifications sent to ${recipientIds.length} recipient(s)`,
      );
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.requested:', error);
    }
  }

  @EventPattern('leave.approved')
  async handleLeaveApproved(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.approved:', event);
    try {
      // Determine recipients based on recipientType
      let recipientIds: number[] = [];

      if (event.recipientType === 'EMPLOYEE') {
        recipientIds = [event.employeeId];
      } else {
        // Default: send to employee
        recipientIds = [event.employeeId]; //  Use employeeId only
      }

      // Get employee info for better notification
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(
        recipientIds[0],
      );

      const dto: SendNotificationDto = {
        recipientId: recipientIds[0],
        recipientEmail: employeeInfo?.email,
        recipientName: employeeInfo?.full_name,
        notificationType: NotificationType.LEAVE_REQUEST_APPROVED,
        priority: Priority.HIGH,
        title: '✅ Leave Request Approved',
        message: `Your leave request for ${event.leaveType || 'leave'} from ${event.startDate} to ${event.endDate} has been approved!`,
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
      // Determine recipients based on recipientType
      let recipientIds: number[] = [];

      if (event.recipientType === 'EMPLOYEE') {
        recipientIds = [event.employeeId];
      } else {
        // Default: send to employee
        recipientIds = [event.employeeId]; //  Use employeeId only
      }

      // Get employee info for better notification
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(
        recipientIds[0],
      );

      const dto: SendNotificationDto = {
        recipientId: recipientIds[0],
        recipientEmail: employeeInfo?.email,
        recipientName: employeeInfo?.full_name,
        notificationType: NotificationType.LEAVE_REQUEST_REJECTED,
        priority: Priority.HIGH,
        title: '❌ Leave Request Rejected',
        message: `Your leave request for ${event.leaveType || 'leave'} has been rejected. Reason: ${event.reason || 'N/A'}`,
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
      const recipientId = event.employeeId; //  Use employeeId only
      
      // Get employee info for better notification
      const employeeInfo = await this.employeeServiceClient.getEmployeeById(recipientId);

      const dto: SendNotificationDto = {
        recipientId,
        recipientEmail: employeeInfo?.email,
        recipientName: employeeInfo?.full_name,
        notificationType: NotificationType.LEAVE_REQUEST_UPDATED,
        priority: Priority.MEDIUM,
        title: 'Leave Request Cancelled',
        message: `Your leave request for ${event.leaveType || 'leave'} has been cancelled.`,
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

  @EventPattern('leave.updated')
  async handleLeaveUpdated(@Payload() event: any): Promise<void> {
    console.log('📬 [LeaveEventListener] Received leave.updated:', event);
    try {
      // Determine recipients based on recipientType
      let recipientIds: number[] = [];

      if (event.recipientType === 'MANAGER') {
        // Get managers (HR_MANAGER or DEPARTMENT_MANAGER) for the department
        if (event.departmentId) {
          const departmentManagers = await this.employeeServiceClient.getManagersForDepartment(
            event.departmentId,
          );
          recipientIds = departmentManagers;
        }

        // Also include all HR managers
        const hrManagers = await this.employeeServiceClient.getAllHRManagers();
        recipientIds = [...new Set([...recipientIds, ...hrManagers])]; // Remove duplicates

        if (recipientIds.length === 0) {
          console.warn(
            `⚠️ [LeaveEventListener] No managers found for department ${event.departmentId}`,
          );
          return;
        }
      } else {
        // Default: send to employee
        recipientIds = [event.employeeId]; //  Use employeeId only
      }

      // Send notification to all recipients
      const notificationPromises = recipientIds.map((recipientId) => {
        const dto: SendNotificationDto = {
          recipientId,
          notificationType: NotificationType.LEAVE_REQUEST_UPDATED,
          priority: Priority.MEDIUM,
          title:
            event.recipientType === 'MANAGER'
              ? `📝 Leave Request Updated - ${event.employeeCode || 'Employee'}`
              : 'Leave Request Updated',
          message:
            event.recipientType === 'MANAGER'
              ? `Employee ${event.employeeCode || event.employeeId} has updated their leave request for ${event.leaveType || 'leave'}. Please review the changes.`
              : `Your leave request for ${event.leaveType || 'leave'} has been updated.`,
          channels: [ChannelType.IN_APP, ChannelType.EMAIL],
          metadata: {
            eventType: 'leave.updated',
            leaveId: event.leaveId,
            leaveType: event.leaveType,
            startDate: event.startDate,
            endDate: event.endDate,
            employeeId: event.employeeId,
            employeeCode: event.employeeCode,
            departmentId: event.departmentId,
            updatedFields: event.updatedFields,
          },
        };

        return this.sendNotificationUseCase.execute(dto);
      });

      await Promise.all(notificationPromises);
      console.log(
        `✅ [LeaveEventListener] Leave update notifications sent to ${recipientIds.length} recipient(s)`,
      );
    } catch (error) {
      console.error('❌ [LeaveEventListener] Error handling leave.updated:', error);
    }
  }
}
