import { Inject, Injectable } from '@nestjs/common';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountRepositoryPort } from '../ports/account.repository.port';
import { HashingServicePort } from '../ports/hashing.service.port';
import { EventPublisherPort } from '../ports/event.publisher.port';
import {
  ACCOUNT_REPOSITORY,
  HASHING_SERVICE,
  EVENT_PUBLISHER,
} from '../tokens';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';

/**
 * DTO for Forgot Password Request
 * Simple flow: User provides email → System generates new password → Sends via email
 */
export class ForgotPasswordRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của tài khoản cần reset mật khẩu',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

/**
 * Simple Forgot Password Use Case
 *
 * Flow:
 * 1. User nhập email
 * 2. Hệ thống tạo mật khẩu mới ngẫu nhiên (8 ký tự)
 * 3. Hash và update vào database
 * 4. Gửi mật khẩu mới về email qua Notification Service
 * 5. User dùng mật khẩu mới để đăng nhập
 * 6. Bắt buộc đổi mật khẩu sau khi đăng nhập lần đầu
 */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepo: AccountRepositoryPort,
    @Inject(HASHING_SERVICE)
    private readonly hashing: HashingServicePort,
    @Inject(EVENT_PUBLISHER)
    private readonly publisher: EventPublisherPort,
  ) {}

  async execute(dto: ForgotPasswordRequestDto): Promise<ApiResponseDto<null>> {
    // Step 1: Validate email exists
    const account = await this.accountRepo.findByEmail(dto.email);
    if (!account) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Email không tồn tại trong hệ thống',
        404,
      );
    }

    // Step 2: Generate new random password (8 characters: letters + numbers)
    const newPassword = this.generateRandomPassword(8);

    // Step 3: Hash new password
    const newPasswordHash = await this.hashing.hash(newPassword);

    // Step 4: Update password in database
    await this.accountRepo.updatePassword(account.id!, newPasswordHash);

    // Step 5: Mark password as temporary (user must change on next login)
    await this.accountRepo.setTemporaryPasswordFlag(account.id!, true);

    // Step 6: Publish event to Notification service to send email with new password
    await this.publisher.publish('auth.password-reset', {
      account_id: account.id,
      employee_id: account.employee_id, // ✅ Add employee_id for notification service
      email: account.email,
      full_name: account.full_name,
      new_password: newPassword, // Send plain password to email (one-time only)
      timestamp: new Date().toISOString(),
    });

    return ApiResponseDto.success(
      null,
      'Mật khẩu mới đã được tạo và gửi về email của bạn. Vui lòng kiểm tra hộp thư và đổi mật khẩu sau khi đăng nhập.',
    );
  }

  /**
   * Generate random password with letters (uppercase + lowercase) and numbers
   * @param length Password length (default: 8)
   * @returns Random password string
   */
  private generateRandomPassword(length: number = 8): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allChars = uppercase + lowercase + numbers;

    let password = '';

    // Ensure at least 1 uppercase, 1 lowercase, 1 number
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    // Fill remaining characters randomly
    for (let i = 3; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password characters
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}
