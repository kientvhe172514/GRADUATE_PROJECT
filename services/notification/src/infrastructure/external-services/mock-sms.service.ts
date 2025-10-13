import { Injectable, Logger } from '@nestjs/common';
import { SmsServicePort } from '../../application/ports/sms.service.port';

/**
 * Mock SMS Service for Development/Testing
 * Logs SMS operations without actually sending messages
 */
@Injectable()
export class MockSmsService implements SmsServicePort {
  private readonly logger = new Logger(MockSmsService.name);

  async send(phoneNumber: string, message: string): Promise<void> {
    this.logger.log('📱 [MOCK] SMS would be sent:');
    this.logger.log(`   To: ${phoneNumber}`);
    this.logger.log(`   Message: ${message.substring(0, 100)}...`);
  }

  async sendBatch(
    recipients: { phoneNumber: string; message: string }[],
  ): Promise<void> {
    this.logger.log(
      `📱 [MOCK] Batch SMS would be sent to ${recipients.length} recipients`,
    );
    recipients.forEach((r, i) => {
      this.logger.log(`   ${i + 1}. ${r.phoneNumber} - ${r.message.substring(0, 50)}...`);
    });
  }
}
