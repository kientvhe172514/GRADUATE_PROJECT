import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { AccountCreatedHandler } from '../../application/handlers/account-created.handler';

@Controller()
export class AccountCreatedListener {
  constructor(private readonly handler: AccountCreatedHandler) {}

  @EventPattern('account_created')
  async handleAccountCreated(event: any): Promise<void> {
    console.log('Received account_created event:', event);  // THÊM LOG NÀY ĐỂ DEBUG
    try {
      await this.handler.handle(event);
      console.log('Handled account_created successfully');  // Log sau khi handle OK
    } catch (error) {
      console.error('Error handling account_created:', error);  // Log nếu có lỗi trong handler
    }
  }
}