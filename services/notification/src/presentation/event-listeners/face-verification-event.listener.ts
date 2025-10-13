import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

@Controller()
export class FaceVerificationEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  @EventPattern('face.verification-success')
  async handleVerificationSuccess(@Payload() event: any): Promise<void> {
    console.log('📬 [FaceVerificationEventListener] Received face.verification-success:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.FACE_VERIFICATION_REQUEST,
        priority: Priority.LOW,
        title: '✅ Face Verification Successful',
        message: `Your identity has been verified successfully at ${new Date().toLocaleTimeString()}`,
        channels: [ChannelType.IN_APP],
        metadata: {
          eventType: 'face.verification-success',
          timestamp: event.timestamp,
          confidence: event.confidence,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [FaceVerificationEventListener] Verification success notification sent');
    } catch (error) {
      console.error('❌ [FaceVerificationEventListener] Error handling face.verification-success:', error);
    }
  }

  @EventPattern('face.verification-failed')
  async handleVerificationFailed(@Payload() event: any): Promise<void> {
    console.log('📬 [FaceVerificationEventListener] Received face.verification-failed:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.FACE_VERIFICATION_REQUEST,
        priority: Priority.URGENT,
        title: '⚠️ Face Verification Failed',
        message: `Face verification failed. Reason: ${event.reason || 'Unknown error'}. Please try again or contact support.`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'face.verification-failed',
          reason: event.reason,
          timestamp: event.timestamp,
          attemptNumber: event.attemptNumber,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [FaceVerificationEventListener] Verification failure notification sent');
    } catch (error) {
      console.error('❌ [FaceVerificationEventListener] Error handling face.verification-failed:', error);
    }
  }

  @EventPattern('face.multiple-failed-attempts')
  async handleMultipleFailedAttempts(@Payload() event: any): Promise<void> {
    console.log('📬 [FaceVerificationEventListener] Received face.multiple-failed-attempts:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId || event.employeeId,
        notificationType: NotificationType.FACE_VERIFICATION_REQUEST,
        priority: Priority.URGENT,
        title: '🚨 Multiple Failed Verification Attempts',
        message: `Multiple face verification attempts have failed. Your account may be temporarily locked for security reasons.`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'face.multiple-failed-attempts',
          attemptCount: event.attemptCount,
          accountLocked: event.accountLocked,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [FaceVerificationEventListener] Multiple failed attempts notification sent');
    } catch (error) {
      console.error('❌ [FaceVerificationEventListener] Error handling face.multiple-failed-attempts:', error);
    }
  }
}
