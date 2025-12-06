import { ApiProperty } from '@nestjs/swagger';

export class CreateAccountResponseDto {
  @ApiProperty({ example: 1, description: 'Account ID' })
  id: number;

  @ApiProperty({ example: 'user@company.com', description: 'Account email' })
  email: string;

  @ApiProperty({
    example: '1',
    description:
      'Temporary password (only returned if custom password not provided)',
  })
  temp_password?: string;

  @ApiProperty({
    example: false,
    description:
      'Whether a custom password was set (true) or temporary password was used (false)',
  })
  has_custom_password?: boolean;
}
