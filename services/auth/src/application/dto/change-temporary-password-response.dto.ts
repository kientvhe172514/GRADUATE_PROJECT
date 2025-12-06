import { ApiProperty } from '@nestjs/swagger';

export class ChangeTemporaryPasswordResponseDto {
  @ApiProperty({
    example: 'Mật khẩu đã được thay đổi thành công',
    description: 'Success message',
  })
  message: string;
}
