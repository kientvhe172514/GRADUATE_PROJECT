import { Injectable, Logger } from '@nestjs/common';
import { EmailServicePort } from '../../application/ports/email.service.port';

/**
 * Mock Email Service for Development/Testing
 * Logs email operations without actually sending emails
 */
@Injectable()
export class MockEmailService implements EmailServicePort {
  private readonly logger = new Logger(MockEmailService.name);

  async send(
    to: string,
    subject: string,
    body: string,
    isHtml?: boolean,
  ): Promise<void> {
    this.logger.log('📧 [MOCK] Email would be sent:');
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Subject: ${subject}`);
    this.logger.log(`   Body: ${body.substring(0, 100)}...`);
    this.logger.log(`   Format: ${isHtml ? 'HTML' : 'Plain Text'}`);
  }

  async sendBatch(
    recipients: { to: string; subject: string; body: string }[],
  ): Promise<void> {
    this.logger.log(
      `📧 [MOCK] Batch email would be sent to ${recipients.length} recipients`,
    );
    recipients.forEach((r, i) => {
      this.logger.log(`   ${i + 1}. ${r.to} - ${r.subject}`);
    });
  }

  async sendWithTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any>,
  ): Promise<void> {
    this.logger.log('📧 [MOCK] Template email would be sent:');
    this.logger.log(`   To: ${to}`);
    this.logger.log(`   Template: ${templateId}`);
    this.logger.log(`   Variables: ${JSON.stringify(variables)}`);
  }
}
