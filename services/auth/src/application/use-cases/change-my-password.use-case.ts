import { Inject, Injectable } from '@nestjs/common';
import { ChangePasswordUseCase, ChangePasswordDto } from './change-password.use-case';
import { ApiResponseDto } from './../../../../shared/src/common/dto/api-response.dto';

export class ChangeMyPasswordRequestDto {
  current_password: string;
  new_password: string;
}

@Injectable()
export class ChangeMyPasswordUseCase {
  constructor(
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  async execute(currentAccountId: number, dto: ChangeMyPasswordRequestDto, ip?: string, ua?: string): Promise<ApiResponseDto<null>> {
    const changeDto: ChangePasswordDto = {
      account_id: currentAccountId,
      current_password: dto.current_password,
      new_password: dto.new_password,
    };
    await this.changePasswordUseCase.changePassword(changeDto, ip, ua);
    return ApiResponseDto.success(null, 'Password changed');
  }
}


