import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountSchema } from '../../infrastructure/persistence/typeorm/account.schema';

@Controller()
export class AccountMessageController {
  constructor(
    @InjectRepository(AccountSchema)
    private accountRepository: Repository<any>,
  ) {}

  @MessagePattern('get_accounts_by_role')
  async getAccountsByRole(data: { role_id: number }): Promise<{ account_ids: number[] }> {
    try {
      const accounts = await this.accountRepository.find({
        where: {
          role_id: data.role_id,
          status: 'ACTIVE',
        },
        select: ['id'],
      });

      const account_ids = accounts.map(account => account.id);
      
      console.log(`✅ Found ${account_ids.length} accounts with role_id=${data.role_id}`);
      
      return { account_ids };
    } catch (error) {
      console.error('Error fetching accounts by role:', error);
      return { account_ids: [] };
    }
  }
}
