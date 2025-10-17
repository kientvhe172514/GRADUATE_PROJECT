import { Inject, Injectable, HttpStatus } from '@nestjs/common';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { TEMPORARY_PASSWORDS_REPOSITORY, HASHING_SERVICE, ACCOUNT_REPOSITORY } from '../tokens';
import { BusinessException } from './../../../../shared/src/common/exceptions/business.exception';
import { ErrorCodes } from './../../../../shared/src/common/enums/error-codes.enum';
import { ApiResponseDto } from './../../../../shared/src/common/dto/api-response.dto';

export class ResetPasswordRequestDto {
  email: string;
  reset_token: string;
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
        ErrorCodes.TOKEN_INVALID,
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


