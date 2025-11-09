import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeTemporaryPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1', description: 'Current temporary password' })
  @IsString()
  current_password: string;

  @ApiProperty({
    example: 'NewPass@123',
    description: 'New password (min 8 chars, must contain uppercase, lowercase, number)',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  new_password: string;

  @ApiProperty({ example: 'NewPass@123', description: 'Confirm new password' })
  @IsString()
  @MinLength(8)
  confirm_password: string;
}
