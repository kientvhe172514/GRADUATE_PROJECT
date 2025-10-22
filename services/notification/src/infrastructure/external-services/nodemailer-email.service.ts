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
    const portRaw = this.configService.get<string>('SMTP_PORT') ?? '587';
    const secureRaw = this.configService.get<string>('SMTP_SECURE') ?? 'false';
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASSWORD');

    const port = Number.parseInt(String(portRaw), 10);
    const secure = String(secureRaw).toLowerCase() === 'true';

    if (!host || !user || !pass) {
      this.logger.warn(
        `SMTP configuration not complete. Email notifications will not work. host=${host ? '✅' : '❌'}, user=${user ? '✅' : '❌'}, pass=${pass ? '✅' : '❌'}`,
      );
      return;
    }

    this.logger.log(`Initializing SMTP transporter: host=${host}, port=${port}, secure=${secure}`);

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
      this.logger.error('Email transporter not initialized - SMTP is not configured');
      throw new Error('SMTP not configured');
    }

    this.logger.log(`Sending email to ${to}`);

    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL') || 'noreply@zentry.com';
    const fromName = this.configService.get<string>('SMTP_FROM_NAME') || 'Zentry HR System';
    const from = `"${fromName}" <${fromEmail}>`;

    try {
      const mail: nodemailer.SendMailOptions = {
        from,
        to,
        subject,
        [isHtml ? 'html' : 'text']: body,
      } as any;

      this.logger.debug(`Email payload: from=${from}, to=${to}, subject=${subject}`);
      const info = await this.transporter.sendMail(mail);

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
