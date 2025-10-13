import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailServicePort } from '../../application/ports/email.service.port';

@Injectable()
export class NodemailerEmailService implements EmailServicePort {
  private readonly logger = new Logger(NodemailerEmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const secure = this.configService.get<boolean>('SMTP_SECURE', false);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration not complete. Email notifications will not work.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    this.logger.log('Email transporter initialized');
  }

  async send(
    to: string,
    subject: string,
    body: string,
    isHtml: boolean = false,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return;
    }

    this.logger.log(`Sending email to ${to}`);

    const from = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@zentry.com',
    );

    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        [isHtml ? 'html' : 'text']: body,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendBatch(
    recipients: { to: string; subject: string; body: string }[],
  ): Promise<void> {
    this.logger.log(`Sending batch of ${recipients.length} emails`);

    const promises = recipients.map((recipient) =>
      this.send(recipient.to, recipient.subject, recipient.body, false),
    );

    await Promise.allSettled(promises);
  }

  async sendWithTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any>,
  ): Promise<void> {
    // TODO: Implement template-based email sending
    this.logger.warn('Template-based email sending not yet implemented');
    throw new Error('Not implemented');
  }
}
