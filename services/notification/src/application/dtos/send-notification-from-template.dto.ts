import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsObject } from 'class-validator';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';

export class SendNotificationFromTemplateDto {
  @IsNotEmpty()
  @IsNumber()
  recipientId: number;

  @IsNotEmpty()
  @IsString()
  templateCode: string;

  @IsNotEmpty()
  @IsObject()
  variables: Record<string, any>;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
