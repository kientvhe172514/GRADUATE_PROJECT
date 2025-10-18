import { NotificationType } from '../enums/notification-type.enum';
import { ChannelType } from '../value-objects/delivery-channel.vo';

export enum TemplateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
}

export class NotificationTemplate {
  id?: number;
  templateCode: string;
  templateName: string;
  notificationType: NotificationType;
  titleTemplate: string;
  messageTemplate: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  defaultChannels: ChannelType[];
  availableVariables?: Record<string, string>;
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<NotificationTemplate>) {
    Object.assign(this, data);
    this.status = this.status || TemplateStatus.DRAFT;
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }

  render(variables: Record<string, any>): {
    title: string;
    message: string;
    emailSubject?: string;
    emailBody?: string;
  } {
    return {
      title: this.replaceVariables(this.titleTemplate, variables),
      message: this.replaceVariables(this.messageTemplate, variables),
      emailSubject: this.emailSubjectTemplate
        ? this.replaceVariables(this.emailSubjectTemplate, variables)
        : undefined,
      emailBody: this.emailBodyTemplate
        ? this.replaceVariables(this.emailBodyTemplate, variables)
        : undefined,
    };
  }

  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  }

  isActive(): boolean {
    return this.status === TemplateStatus.ACTIVE;
  }

  activate(): void {
    this.status = TemplateStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = TemplateStatus.INACTIVE;
    this.updatedAt = new Date();
  }
}
