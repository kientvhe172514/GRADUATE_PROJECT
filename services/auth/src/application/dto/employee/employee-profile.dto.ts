import { ApiProperty } from '@nestjs/swagger';

export class EmployeeProfileDto {
  @ApiProperty({ example: 1, description: 'Employee ID' })
  id: number;

  @ApiProperty({ example: '+84 901234567', required: false })
  phone?: string | null;

  @ApiProperty({
    required: false,
    description: 'Structured address object synced from Employee Service',
    example: {
      city: 'Ho Chi Minh',
      district: 'District 1',
      addressLine: '123 Nguyen Hue',
    },
  })
  address?: Record<string, any> | null;

  @ApiProperty({
    required: false,
    description: 'Date of birth sourced from Employee Service',
    example: '1995-05-10',
  })
  dateOfBirth?: string | Date | null;
}
