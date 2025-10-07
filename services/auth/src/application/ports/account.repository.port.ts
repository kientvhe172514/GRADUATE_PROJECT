import { Account } from '../../domain/entities/account.entity';
import { CreateAccountDto } from '../dto/create-account.dto';

export interface AccountRepositoryPort {
  create(account: Account): Promise<Account>;  // SỬA: Đổi từ CreateAccountDto sang Account
  findByEmail(email: string): Promise<Account | null>;
  updateLastLogin(id: number, ip: string): Promise<void>;
}