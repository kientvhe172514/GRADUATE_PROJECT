import { IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

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
}
