import { IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ChannelType } from '../../domain/value-objects/delivery-channel.vo';

export class GetUserNotificationsDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(ChannelType)
  channelFilter?: ChannelType;
}
