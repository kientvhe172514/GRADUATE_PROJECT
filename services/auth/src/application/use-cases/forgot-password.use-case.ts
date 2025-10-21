import { Inject, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { TemporaryPasswordsRepositoryPort } from '../ports/temporary-passwords.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import { ACCOUNT_REPOSITORY, TEMPORARY_PASSWORDS_REPOSITORY, HASHING_SERVICE, EVENT_PUBLISHER } from '../tokens';
import { TemporaryPasswords } from '../../domain/entities/temporary-passwords.entity';
import { ApiResponseDto } from '@graduate-project/shared-common';

export class ForgotPasswordRequestDto {
  email: string;
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepositoryPort,
    @Inject(TEMPORARY_PASSWORDS_REPOSITORY)
    private readonly tempRepo: TemporaryPasswordsRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private readonly publisher: EventPublisherPort,
  ) {}

  async execute(dto: ForgotPasswordRequestDto): Promise<ApiResponseDto<null>> {
    const account = await this.accountRepo.findByEmail(dto.email);
    if (!account) {
      // Avoid account enumeration: exit silently
      return ApiResponseDto.success(null, 'If the email exists, a reset link will be sent');
    }

    // Generate reset token (random) and store hashed in temporary_passwords
    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = await this.hashing.hash(resetToken);

    const temp = new TemporaryPasswords({
      account_id: account.id!,
      temp_password_hash: tokenHash,
      expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      must_change_password: true,
    });
    await this.tempRepo.create(temp);

    // Publish event to Notification service to send email
    await this.publisher.publish('auth.password-reset-requested', {
      account_id: account.id,
      email: account.email,
      full_name: account.full_name,
      reset_token: resetToken, // plain token for email link
      expires_at: temp.expires_at,
    });

    return ApiResponseDto.success(null, 'If the email exists, a reset link will be sent');
  }
}


