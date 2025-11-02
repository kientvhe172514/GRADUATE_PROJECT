import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';
import {
  UserRegisteredEventDto,
  PasswordChangedEventDto,
  PasswordResetRequestedEventDto,
  LoginSuccessEventDto,
  SuspiciousLoginEventDto,
  AccountLockedEventDto,
} from '../../application/event-listeners/dto/auth-event.dtos';

@Controller()
export class AuthEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern('auth.user-registered')
  async handleUserRegistered(@Payload() event: UserRegisteredEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.user-registered:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.HIGH,
        title: '🎉 Welcome to Zentry HR System!',
        message: `Welcome ${event.fullName || event.email}! Your account has been created successfully. Please verify your email to get started.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.user-registered',
          email: event.email,
          registrationDate: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] User registration notification sent successfully');
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.user-registered:', error);
    }
  }

  @EventPattern('auth.password-changed')
  async handlePasswordChanged(@Payload() event: PasswordChangedEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.password-changed:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.HIGH,
        title: '🔐 Password Changed',
        message: `Your password was changed successfully at ${new Date().toLocaleString()}. If you didn't make this change, please contact support immediately.`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.password-changed',
          timestamp: event.timestamp,
          ipAddress: event.ipAddress,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] Password change notification sent successfully');
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.password-changed:', error);
    }
  }

  @EventPattern('auth.password-reset-requested')
  async handlePasswordResetRequested(@Payload() event: PasswordResetRequestedEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.password-reset-requested:', event);
    try {
      // Debug log để kiểm tra email
      console.log('📧 [AuthEventListener] Sending reset email to:', event.email);
      console.log('📧 [AuthEventListener] Account ID:', event.account_id);
      console.log('📧 [AuthEventListener] Reset token:', event.reset_token);

      const dto: SendNotificationDto = {
        recipientId: event.account_id,
        recipientEmail: event.email, // Đảm bảo email đúng
        recipientName: event.full_name || 'User',
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.URGENT,
        title: '🔑 Password Reset Request',
        message: [
          `Hello ${event.full_name || 'User'},`,
          '',
          'A password reset has been requested for your account.',
          '',
          'Please use the following information to reset your password:',
          '',
          `📧 Email: ${event.email}`,
          `🔑 Reset Token: ${event.reset_token}`,
          `⏰ Valid until: ${new Date(event.expires_at).toLocaleString()}`,
          '',
          'To reset your password, please:',
          '1. Go to the password reset page',
          '2. Enter your email and the reset token above',
          '3. Enter your new password',
          '',
          'If you didn\'t request this, please ignore this email and contact support if needed.',
          '',
          'Best regards,',
          'Zentry HR System'
        ].join('\n'),
        channels: [ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.password-reset-requested',
          resetToken: event.reset_token,
          expiresAt: event.expires_at,
          email: event.email,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] Password reset request notification sent successfully to:', event.email);
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.password-reset-requested:', error);
    }
  }

  @EventPattern('auth.login-success')
  async handleLoginSuccess(@Payload() event: LoginSuccessEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.login-success:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.LOW,
        title: '✅ Login Successful',
        message: `You logged in successfully from ${event.ipAddress || 'unknown location'} at ${new Date().toLocaleString()}`,
        channels: [ChannelType.IN_APP],
        metadata: {
          eventType: 'auth.login-success',
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] Login success notification sent successfully');
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.login-success:', error);
    }
  }

  @EventPattern('auth.suspicious-login')
  async handleSuspiciousLogin(@Payload() event: SuspiciousLoginEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.suspicious-login:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.URGENT,
        title: '⚠️ Suspicious Login Detected',
        message: `A suspicious login attempt was detected from ${event.ipAddress || 'unknown location'}. If this wasn't you, please change your password immediately.`,
        channels: [ChannelType.IN_APP, ChannelType.PUSH, ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.suspicious-login',
          ipAddress: event.ipAddress,
          location: event.location,
          timestamp: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] Suspicious login notification sent successfully');
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.suspicious-login:', error);
    }
  }

  @EventPattern('auth.account-locked')
  async handleAccountLocked(@Payload() event: AccountLockedEventDto): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.account-locked:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.userId,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.URGENT,
        title: '🔒 Account Locked',
        message: `Your account has been locked due to ${event.reason || 'multiple failed login attempts'}. Please contact support to unlock your account.`,
        channels: [ChannelType.IN_APP, ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.account-locked',
          reason: event.reason,
          timestamp: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log('✅ [AuthEventListener] Account locked notification sent successfully');
    } catch (error) {
      console.error('❌ [AuthEventListener] Error handling auth.account-locked:', error);
    }
  }
}


