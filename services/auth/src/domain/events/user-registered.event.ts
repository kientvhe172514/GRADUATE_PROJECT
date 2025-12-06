import { Account } from '../entities/account.entity';

export class UserRegisteredEvent {
  constructor(public readonly account: Account) {}
}
