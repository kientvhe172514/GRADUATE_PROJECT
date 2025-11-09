import { ApiProperty } from '@nestjs/swagger';

export class GetAccountResponseDto {
  @ApiProperty({ example: 1, description: 'Account ID' })
  id: number;

  @ApiProperty({ example: 'user@company.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Full name', required: false })
  full_name?: string;

  @ApiProperty({ example: 'EMPLOYEE', description: 'User role' })
  role: string;

  @ApiProperty({ example: 'ACTIVE', description: 'Account status' })
  status: string;

  @ApiProperty({ example: 1, description: 'Employee ID', required: false })
  employee_id?: number;

  @ApiProperty({ example: 'EMP001', description: 'Employee code', required: false })
  employee_code?: string;

  @ApiProperty({ example: 1, description: 'Department ID', required: false })
  department_id?: number;

  @ApiProperty({ example: 'Engineering', description: 'Department name', required: false })
  department_name?: string;

  @ApiProperty({ example: 1, description: 'Position ID', required: false })
  position_id?: number;

  @ApiProperty({ example: 'Senior Developer', description: 'Position name', required: false })
  position_name?: string;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'Last login timestamp', 
    required: false 
  })
  last_login_at?: Date;

  @ApiProperty({ 
    example: '192.168.1.1', 
    description: 'Last login IP address', 
    required: false 
  })
  last_login_ip?: string;

  @ApiProperty({ 
    example: '2024-01-01T08:00:00.000Z', 
    description: 'Account creation timestamp' 
  })
  created_at?: Date;

  @ApiProperty({ 
    example: '2024-01-15T10:30:00.000Z', 
    description: 'Last update timestamp' 
  })
  updated_at?: Date;
}

