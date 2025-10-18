import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsBoolean, IsString, Matches } from 'class-validator';
import { NotificationType } from '../../domain/enums/notification-type.enum';

export class UpdateNotificationPreferenceDto {
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  notificationType: NotificationType;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'doNotDisturbStart must be in HH:mm format',
  })
  doNotDisturbStart?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'doNotDisturbEnd must be in HH:mm format',
  })
  doNotDisturbEnd?: string;
}
