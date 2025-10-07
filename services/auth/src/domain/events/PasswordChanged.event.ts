import { Account } from '../entities/account.entity';

export class PasswordChangedEvent {
  constructor(public readonly account: Account) {}
}