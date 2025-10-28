import { IsNumber, IsArray, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class GrantPermissionsToAccountDto {
  @IsNumber()
  account_id: number;

  @IsArray()
  @IsNumber({}, { each: true })
  permission_ids: number[];

  @IsOptional()
  @IsBoolean()
  is_granted?: boolean;

  @IsOptional()
  @IsObject()
  scope_constraints?: Record<string, any>;
}

export class RevokePermissionsFromAccountDto {
  @IsNumber()
  account_id: number;

  @IsArray()
  @IsNumber({}, { each: true })
  permission_ids: number[];
}
