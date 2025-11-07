import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalanceTransactionEntity } from '../../../domain/entities/leave-balance-transaction.entity';
import { ILeaveBalanceTransactionRepository } from '../../../application/ports/leave-balance-transaction.repository.interface';
import { LeaveBalanceTransactionSchema } from '../typeorm/leave-balance-transaction.schema';

@Injectable()
export class PostgresLeaveBalanceTransactionRepository implements ILeaveBalanceTransactionRepository {
  constructor(
    @InjectRepository(LeaveBalanceTransactionSchema)
    private readonly repository: Repository<LeaveBalanceTransactionEntity>,
  ) {}

  async create(tx: Partial<LeaveBalanceTransactionEntity>): Promise<LeaveBalanceTransactionEntity> {
    const entity = this.repository.create(tx);
    return this.repository.save(entity);
  }

  async listByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceTransactionEntity[]> {
    return this.repository.find({ where: { employee_id: employeeId, year }, order: { created_at: 'DESC' } });
  }
}


