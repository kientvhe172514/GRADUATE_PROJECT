import { Injectable, Inject } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import * as bcrypt from 'bcrypt';
import { UserRepositoryPort } from '../ports/user.repository.port';

@Injectable()
export class LoginUseCase {
  constructor(@Inject('UserRepositoryPort') private userRepository: UserRepositoryPort) {
    console.log('LoginUseCase: UserRepository injected:', this.userRepository); // Debug
    if (!this.userRepository) {
      console.error('LoginUseCase: Failed to inject UserRepository');
    }
  }

  async execute(dto: LoginDto): Promise<{ token: string; role: string }> {
    const user = await this.userRepository.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new InvalidCredentialsException();
    }

    const token = `jwt-${user.id}-${user.role}-${Date.now()}`;
    return { token, role: user.role };
  }
}