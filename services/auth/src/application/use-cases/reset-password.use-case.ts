import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { TEMPORARY_PASSWORDS_REPOSITORY, HASHING_SERVICE, ACCOUNT_REPOSITORY } from '../tokens';
import { BusinessException, ErrorCodes, ApiResponseDto } from '@graduate-project/shared-common';

export class ResetPasswordRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  reset_token: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private readonly tempRepo: TemporaryPasswordsRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashing: HashingServicePort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepositoryPort,
  ) {}

  async execute(dto: ResetPasswordRequestDto): Promise<ApiResponseDto<null>> {
    console.log('🔍 ResetPasswordUseCase - Received DTO:', JSON.stringify(dto, null, 2));
    console.log('🔍 ResetPasswordUseCase - DTO fields:', {
      email: dto?.email,
      reset_token: dto?.reset_token,
      new_password: dto?.new_password,
      hasEmail: !!dto?.email,
      hasResetToken: !!dto?.reset_token,
      hasNewPassword: !!dto?.new_password
    });
    
    if (!dto?.email || !dto?.reset_token || !dto?.new_password) {
      throw new BusinessException(
        ErrorCodes.BAD_REQUEST,
        'Missing required fields: email, reset_token, new_password',
      );
    }
    const account = await this.accountRepo.findByEmail(dto.email);
    if (!account) {
      throw new BusinessException(
        ErrorCodes.UNAUTHORIZED,
        'Invalid token or email',
      );
    }

    const temp = await this.tempRepo.findActiveByAccountId(account.id!);
    if (!temp) {
      throw new BusinessException(
        ErrorCodes.INVALID_TOKEN,
        'Invalid or expired reset token',
      );
    }

    const isValid = await this.hashing.compare(dto.reset_token, temp.temp_password_hash);
    if (!isValid) {
      throw new BusinessException(
        ErrorCodes.UNAUTHORIZED,
        'Invalid token or email',
      );
    }

    // Update password
    const newHash = await this.hashing.hash(dto.new_password);
    await this.accountRepo.updatePassword(account.id!, newHash);

    // Invalidate the token
    await this.tempRepo.markAsUsed(temp.id!);
    return ApiResponseDto.success(null, 'Password reset successfully');
  }
}


