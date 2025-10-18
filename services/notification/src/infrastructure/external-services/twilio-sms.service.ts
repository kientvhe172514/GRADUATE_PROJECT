import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsServicePort } from '../../application/ports/sms.service.port';

@Injectable()
export class TwilioSmsService implements SmsServicePort, OnModuleInit {
  private readonly logger = new Logger(TwilioSmsService.name);
  private twilioClient: any;
  private fromPhoneNumber: string;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.fromPhoneNumber = this.configService.get<string>(
      'TWILIO_PHONE_NUMBER',
      '',
    );

    if (!accountSid || !authToken || !this.fromPhoneNumber) {
      this.logger.warn(
        'Twilio configuration not complete. SMS notifications will not work.',
      );
      this.logger.warn(
        'Required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER',
      );
      return;
    }

    try {
      // Lazy load twilio to avoid installation requirement in dev
      const twilio = require('twilio');
      this.twilioClient = twilio(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('✅ Twilio SMS service initialized successfully');
    } catch (error) {
      this.logger.error(
        'Failed to initialize Twilio. Install it with: npm install twilio',
      );
      this.logger.error(error);
    }
  }

  async send(phoneNumber: string, message: string): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured. Skipping SMS send.');
      return;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromPhoneNumber,
        to: phoneNumber,
      });

      this.logger.log(`SMS sent successfully to ${phoneNumber}: ${result.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      throw error;
    }
  }

  async sendBatch(
    recipients: { phoneNumber: string; message: string }[],
  ): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Twilio not configured. Skipping batch SMS send.');
      return;
    }

    const results = await Promise.allSettled(
      recipients.map((r) => this.send(r.phoneNumber, r.message)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Batch SMS sent: ${succeeded} succeeded, ${failed} failed out of ${recipients.length}`,
    );
  }
}
