import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {  // Export class → OK module
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  refresh_token: string;

  @ApiProperty()
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
  };
}