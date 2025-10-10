import { Account } from '../../domain/entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';

export interface AccountRepositoryPort {
  create(account: Account): Promise<Account>;
  findByEmail(email: string): Promise<Account | null>;
  findById(id: number): Promise<Account | null>;
  updateLastLogin(id: number, ip: string): Promise<void>;
  incrementFailedLoginAttempts(id: number): Promise<void>;
  resetFailedLoginAttempts(id: number): Promise<void>;
  lockAccount(id: number, lockedUntil: Date): Promise<void>;
  unlockAccount(id: number): Promise<void>;
  updatePassword(id: number, passwordHash: string): Promise<void>;
}