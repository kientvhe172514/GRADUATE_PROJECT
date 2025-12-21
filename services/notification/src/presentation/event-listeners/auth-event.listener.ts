import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendNotificationUseCase } from '../../application/use-cases/send-notification.use-case';
import { SendNotificationDto } from '../../application/dtos/send-notification.dto';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

@Controller()
export class AuthEventListener {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern('auth.user-registered')
  async handleUserRegistered(@Payload() event: any): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.user-registered:', event);
    console.log(`📧 Sending credentials to: ${event.email}`);
    console.log(
      `🔐 Login username (company email): ${event.companyEmail || event.email}`,
    );
    try {
      // Use companyEmail as username if provided, otherwise use email
      const loginUsername = event.companyEmail || event.email;
      const isPersonalEmail =
        event.companyEmail && event.companyEmail !== event.email;

      const dto: SendNotificationDto = {
        recipientId: event.employeeId, // ✅ Use employeeId (not userId/account_id)
        recipientEmail: event.email, // Send to this email (personal or company)
        recipientName: event.fullName,
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.HIGH,
        title: '🎉 Welcome to Zentry HR System!',
        message: [
          `Hello ${event.fullName || 'User'},`,
          '',
          'Your account has been created successfully!',
          '',
          isPersonalEmail
            ? `📬 This email is sent to your personal email: ${event.email}`
            : '',
          isPersonalEmail
            ? `⚠️ Please use your COMPANY EMAIL to login, not this personal email!`
            : '',
          isPersonalEmail ? '' : '',
          'Please use the following credentials to log in:',
          '',
          `📧 Username (Company Email): ${loginUsername}`,
          `🔑 Temporary Password: ${event.tempPassword}`,
          '',
          '⚠️ IMPORTANT SECURITY NOTICE:',
          '• This is a temporary password',
          '• You MUST change it immediately after first login',
          '• Do not share this password with anyone',
          '• Delete this email after changing your password',
          '',
          'To login and change your password:',
          '1. Go to the login page',
          `2. Enter username: ${loginUsername}`,
          `3. Enter the temporary password above`,
          '4. You will be prompted to create a new password',
          '5. Choose a strong, unique password',
          '',
          'Best regards,',
          'Zentry HR System',
        ]
          .filter((line) => line !== '')
          .join('\n'), // Remove empty strings
        channels: [ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.user-registered',
          recipientEmail: event.email,
          loginUsername: loginUsername,
          registrationDate: event.timestamp,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(
        `✅ [AuthEventListener] User registration notification sent successfully to: ${event.email}`,
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.user-registered:',
        error,
      );
    }
  }

  @EventPattern('auth.password-changed')
  async handlePasswordChanged(@Payload() event: any): Promise<void> {
    console.log(
      '📬 [AuthEventListener] Received auth.password-changed:',
      event,
    );
    try {
      const dto: SendNotificationDto = {
        recipientId: event.employeeId, //  Use employeeId
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
      console.log(
        '✅ [AuthEventListener] Password change notification sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.password-changed:',
        error,
      );
    }
  }

  @EventPattern('auth.password-reset')
  async handlePasswordReset(@Payload() event: any): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.password-reset:', event);
    try {
      // Debug log để kiểm tra email
      console.log(
        '📧 [AuthEventListener] Sending new password email to:',
        event.email,
      );
      console.log('📧 [AuthEventListener] Account ID:', event.account_id);
      console.log('📧 [AuthEventListener] New temporary password provided');

      const dto: SendNotificationDto = {
        recipientId: event.account_id,
        recipientEmail: event.email,
        recipientName: event.full_name || 'User',
        notificationType: NotificationType.PASSWORD_RESET,
        priority: Priority.URGENT,
        title: '🔑 Your New Password',
        message: [
          `Hello ${event.full_name || 'User'},`,
          '',
          'Your password has been successfully reset.',
          '',
          'Your new temporary password is:',
          '',
          `� Password: ${event.new_password}`,
          '',
          '⚠️ IMPORTANT SECURITY NOTICE:',
          '• This is a temporary password',
          '• You will be required to change it on your next login',
          '• Do not share this password with anyone',
          '• Delete this email after changing your password',
          '',
          'To login:',
          '1. Use your email and the password above',
          '2. You will be prompted to create a new password',
          '3. Choose a strong, unique password',
          '',
          "If you didn't request this password reset, please contact support immediately.",
          '',
          'Best regards,',
          'Zentry HR System',
        ].join('\n'),
        channels: [ChannelType.EMAIL],
        metadata: {
          eventType: 'auth.password-reset',
          email: event.email,
          temporaryPassword: true,
        },
      };

      await this.sendNotificationUseCase.execute(dto);
      console.log(
        '✅ [AuthEventListener] New password notification sent successfully to:',
        event.email,
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.password-reset:',
        error,
      );
    }
  }

  @EventPattern('auth.login-success')
  async handleLoginSuccess(@Payload() event: any): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.login-success:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.employeeId, //  Use employeeId
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
      console.log(
        '✅ [AuthEventListener] Login success notification sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.login-success:',
        error,
      );
    }
  }

  @EventPattern('auth.suspicious-login')
  async handleSuspiciousLogin(@Payload() event: any): Promise<void> {
    console.log(
      '📬 [AuthEventListener] Received auth.suspicious-login:',
      event,
    );
    try {
      const dto: SendNotificationDto = {
        recipientId: event.employeeId, //  Use employeeId
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
      console.log(
        '✅ [AuthEventListener] Suspicious login notification sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.suspicious-login:',
        error,
      );
    }
  }

  @EventPattern('auth.account-locked')
  async handleAccountLocked(@Payload() event: any): Promise<void> {
    console.log('📬 [AuthEventListener] Received auth.account-locked:', event);
    try {
      const dto: SendNotificationDto = {
        recipientId: event.employeeId, //  Use employeeId
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
      console.log(
        '✅ [AuthEventListener] Account locked notification sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AuthEventListener] Error handling auth.account-locked:',
        error,
      );
    }
  }
}
