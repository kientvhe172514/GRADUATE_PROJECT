import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY, NOTIFICATION_PREFERENCE_REPOSITORY } from './send-notification.use-case';
import { NotificationRepositoryPort } from '../ports/notification.repository.port';
import { NotificationPreferenceRepositoryPort } from '../ports/notification-preference.repository.port';
import { SendBulkNotificationDto, RecipientType, BulkNotificationResponseDto } from '../dtos/bulk-notification.dto';
import { SendNotificationUseCase } from './send-notification.use-case';
import { EmployeeServiceClient } from '../../infrastructure/external-services/employee-service.client';

@Injectable()
export class SendBulkNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
    @Inject(NOTIFICATION_PREFERENCE_REPOSITORY)
    private readonly preferenceRepository: NotificationPreferenceRepositoryPort,
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly employeeServiceClient: EmployeeServiceClient,
  ) {}

  async execute(dto: SendBulkNotificationDto): Promise<BulkNotificationResponseDto> {
    // Resolve recipient IDs based on recipient type
    let recipientIds: number[] = [];

    switch (dto.recipientType) {
      case RecipientType.INDIVIDUAL:
        if (!dto.recipientIds || dto.recipientIds.length === 0) {
          throw new Error('recipientIds is required when recipientType is INDIVIDUAL');
        }
        recipientIds = dto.recipientIds;
        break;

      case RecipientType.DEPARTMENT:
        if (!dto.departmentIds || dto.departmentIds.length === 0) {
          throw new Error('departmentIds is required when recipientType is DEPARTMENT');
        }
        // Get all employees in these departments
        for (const deptId of dto.departmentIds) {
          const employees = await this.employeeServiceClient.getEmployeesByDepartment(deptId);
          recipientIds.push(...employees);
        }
        break;

      case RecipientType.ALL_EMPLOYEES:
        // Get all employees in the system
        recipientIds = await this.employeeServiceClient.getAllEmployees();
        break;

      case RecipientType.ROLE:
        if (!dto.roles || dto.roles.length === 0) {
          throw new Error('roles is required when recipientType is ROLE');
        }
        // Get all employees with these roles
        for (const role of dto.roles) {
          const employees = await this.employeeServiceClient.getEmployeesByRole(role);
          recipientIds.push(...employees);
        }
        break;
    }

    // Remove duplicates
    recipientIds = [...new Set(recipientIds)];

    console.log(`📨 [Bulk Notification] Sending to ${recipientIds.length} recipients`);

    // Send notification to all recipients (in parallel for performance)
    const sendPromises = recipientIds.map((recipientId) =>
      this.sendNotificationUseCase.execute({
        recipientId,
        notificationType: dto.notificationType,
        priority: dto.priority,
        title: dto.title,
        message: dto.message,
        channels: dto.channels,
        metadata: dto.metadata,
      }).catch((error) => {
        console.error(`❌ [Bulk Notification] Failed to send to recipient ${recipientId}:`, error.message);
        return null; // Don't fail entire batch if one fails
      }),
    );

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r !== null).length;

    console.log(`✅ [Bulk Notification] Sent ${successCount}/${recipientIds.length} notifications successfully`);

    return {
      sent_count: successCount,
      recipient_count: recipientIds.length,
      recipient_ids: recipientIds,
    };
  }
}
