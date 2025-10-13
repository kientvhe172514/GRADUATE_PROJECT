import { IsNotEmpty, IsString, IsEnum, IsOptional, IsNumber, IsObject, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { Priority } from '../../domain/enums/priority.enum';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export class SendNotificationDto {
  @IsNotEmpty()
  @IsNumber()
  recipientId: number;

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  recipientName?: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsArray()
  @IsEnum(ChannelType, { each: true })
  channels?: ChannelType[];

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;

  @IsOptional()
  @IsObject()
  relatedData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}
