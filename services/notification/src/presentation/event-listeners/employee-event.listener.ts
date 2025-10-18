import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

@Controller()
export class EmployeeEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  @EventPattern('employee.created')
  async handleEmployeeCreated(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.created:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.HIGH,
        title: '🎉 Welcome to the Team!',
        message: `Welcome ${event.fullName || event.firstName}! Your employee profile has been created. Please complete your profile setup.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'employee.created',
          employeeId: event.employeeId,
          department: event.department,
          position: event.position,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Employee creation notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.created:', error);
    }
  }

  @EventPattern('employee.updated')
  async handleEmployeeUpdated(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.updated:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.MEDIUM,
        title: '📝 Profile Updated',
        message: `Your employee profile has been updated. ${event.updatedFields ? 'Updated fields: ' + event.updatedFields.join(', ') : ''}`,
        channels: [ChannelType.IN_APP],
        metadata: {
          eventType: 'employee.updated',
          employeeId: event.employeeId,
          updatedFields: event.updatedFields,
          updatedBy: event.updatedBy,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Employee update notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.updated:', error);
    }
  }

  @EventPattern('employee.deactivated')
  async handleEmployeeDeactivated(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.deactivated:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.URGENT,
        title: '⚠️ Account Deactivated',
        message: `Your employee account has been deactivated. Reason: ${event.reason || 'Not specified'}. Please contact HR for more information.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'employee.deactivated',
          employeeId: event.employeeId,
          reason: event.reason,
          deactivatedBy: event.deactivatedBy,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Employee deactivation notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.deactivated:', error);
    }
  }

  @EventPattern('employee.promoted')
  async handleEmployeePromoted(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.promoted:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.HIGH,
        title: '🎊 Congratulations on Your Promotion!',
        message: `Congratulations! You have been promoted to ${event.newPosition || 'a new position'}. ${event.message || ''}`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'employee.promoted',
          employeeId: event.employeeId,
          oldPosition: event.oldPosition,
          newPosition: event.newPosition,
          effectiveDate: event.effectiveDate,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Employee promotion notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.promoted:', error);
    }
  }

  @EventPattern('employee.department-changed')
  async handleDepartmentChanged(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.department-changed:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.MEDIUM,
        title: '🏢 Department Transfer',
        message: `You have been transferred from ${event.oldDepartment || 'previous department'} to ${event.newDepartment}. Effective from: ${event.effectiveDate || 'immediately'}`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'employee.department-changed',
          employeeId: event.employeeId,
          oldDepartment: event.oldDepartment,
          newDepartment: event.newDepartment,
          effectiveDate: event.effectiveDate,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Department change notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.department-changed:', error);
    }
  }

  @EventPattern('employee.contract-expiring')
  async handleContractExpiring(@Payload() event: any): Promise<void> {
    console.log('📬 [EmployeeEventListener] Received employee.contract-expiring:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
        priority: Priority.HIGH,
        title: '⏰ Contract Expiring Soon',
        message: `Your employment contract is expiring on ${event.expiryDate}. Please contact HR to discuss renewal.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'employee.contract-expiring',
          employeeId: event.employeeId,
          expiryDate: event.expiryDate,
          daysRemaining: event.daysRemaining,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [EmployeeEventListener] Contract expiring notification sent successfully');
    } catch (error) {
      console.error('❌ [EmployeeEventListener] Error handling employee.contract-expiring:', error);
    }
  }
}
