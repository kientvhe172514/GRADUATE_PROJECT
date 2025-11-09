import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user-info.dto';

export class LoginResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT refresh token' })
  refresh_token: string;

  @ApiProperty({ 
    required: false, 
    example: true, 
    description: 'Flag indicating if user must change temporary password' 
  })
  must_change_password?: boolean;

  @ApiProperty({ type: UserInfoDto, description: 'User information' })
  user: UserInfoDto;
}