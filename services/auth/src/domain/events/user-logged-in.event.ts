import { Account } from '../entities/account.entity';

export class UserLoggedInEvent {
  constructor(public readonly account: Account) {}
}
