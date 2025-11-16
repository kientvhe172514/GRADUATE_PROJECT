import { NotificationTemplate } from '../../../../domain/entities/notification-template.entity';
import { NotificationTemplateSchema } from '../schemas/notification-template.schema';

export class NotificationTemplateMapper {
  static toDomain(schema: NotificationTemplateSchema): NotificationTemplate {
    return new NotificationTemplate({
      id: schema.id,
      templateCode: schema.template_code,
      templateName: schema.template_name,
      notificationType: schema.notification_type as any,
      titleTemplate: schema.title_template,
      messageTemplate: schema.message_template,
      emailSubjectTemplate: schema.email_subject_template,
      emailBodyTemplate: schema.email_body_template,
      availableVariables: schema.available_variables as any,
      defaultChannels: schema.default_channels as any,
      status: schema.status as any,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at,
    });
  }

  static toSchema(domain: NotificationTemplate): NotificationTemplateSchema {
    const schema = new NotificationTemplateSchema();
    if (domain.id) schema.id = domain.id;
    schema.template_code = domain.templateCode;
    schema.template_name = domain.templateName;
    schema.notification_type = domain.notificationType;
    schema.title_template = domain.titleTemplate;
    schema.message_template = domain.messageTemplate;
    if (domain.emailSubjectTemplate) schema.email_subject_template = domain.emailSubjectTemplate;
    if (domain.emailBodyTemplate) schema.email_body_template = domain.emailBodyTemplate;
    if (domain.availableVariables) schema.available_variables = domain.availableVariables;
    if (domain.defaultChannels) schema.default_channels = domain.defaultChannels as any;
    schema.status = domain.status;
    if (domain.createdAt) schema.created_at = domain.createdAt;
    if (domain.updatedAt) schema.updated_at = domain.updatedAt;
    return schema;
  }
}
