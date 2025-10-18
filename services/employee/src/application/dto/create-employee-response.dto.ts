import { ApiProperty } from '@nestjs/swagger';

export class CreateEmployeeResponseDto {
  @ApiProperty({ description: 'Employee ID' })
  id: number;

  @ApiProperty({ description: 'Account ID' })
  account_id?: number;

  @ApiProperty({ description: 'Employee code' })
  employee_code: string;

  @ApiProperty({ description: 'Full name' })
  full_name: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ description: 'Hire date' })
  hire_date: Date;

  @ApiProperty({ description: 'Onboarding status' })
  onboarding_status: string;

  @ApiProperty({ description: 'Temporary password (only on creation)' })
  temp_password?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;
}
