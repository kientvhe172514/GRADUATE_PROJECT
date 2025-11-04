import { ApiProperty } from '@nestjs/swagger';

export class AccountCreatedEventDto {
  @ApiProperty()
  account_id: number;

  @ApiProperty()
  employee_id: number;

  
  @ApiProperty()
  temp_password: string;
}