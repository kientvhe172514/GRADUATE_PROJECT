import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { AccountCreatedHandler } from '../../application/handlers/account-created.handler';

@Controller()
export class AccountCreatedListener {
  constructor(private readonly handler: AccountCreatedHandler) {}

  @EventPattern('account_created')
  async handleAccountCreated(event: any): Promise<void> {
    await this.handler.handle(event);
  }
}