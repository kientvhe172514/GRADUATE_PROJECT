import { TemporaryPasswords } from '../../domain/entities/temporary-passwords.entity';

export interface TemporaryPasswordsRepositoryPort {
  create(tempPassword: TemporaryPasswords): Promise<TemporaryPasswords>;
  findByAccountId(accountId: number): Promise<TemporaryPasswords[]>;
  findActiveByAccountId(accountId: number): Promise<TemporaryPasswords | null>;
  markAsUsed(id: number): Promise<void>;
  deleteExpired(): Promise<number>;
  deleteByAccountId(accountId: number): Promise<void>;
  findById(id: number): Promise<TemporaryPasswords | null>;
}
