import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({ example: 1, description: 'User account ID' })
  id: number;

  @ApiProperty({ example: 'user@company.com', description: 'User email address' })
  email: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Full name of the user' })
  full_name: string;

  @ApiProperty({ example: 'EMPLOYEE', description: 'User role' })
  role: string;
}
