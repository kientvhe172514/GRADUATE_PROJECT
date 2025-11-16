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

  async findByEmployee(
    employeeId: number,
    filters?: {
      year?: number;
      leave_type_id?: number;
      transaction_type?: string;
      limit?: number;
    },
  ): Promise<LeaveBalanceTransactionEntity[]> {
    const where: any = { employee_id: employeeId };
    
    if (filters?.year) {
      where.year = filters.year;
    }
    
    if (filters?.leave_type_id) {
      where.leave_type_id = filters.leave_type_id;
    }
    
    if (filters?.transaction_type) {
      where.transaction_type = filters.transaction_type;
    }

    const queryOptions: any = {
      where,
      order: { created_at: 'DESC' },
    };

    if (filters?.limit) {
      queryOptions.take = filters.limit;
    }

    return this.repository.find(queryOptions);
  }

  async findByLeaveRecord(leaveRecordId: number): Promise<LeaveBalanceTransactionEntity[]> {
    return this.repository.find({
      where: {
        reference_type: 'LEAVE_RECORD',
        reference_id: leaveRecordId,
      },
      order: { created_at: 'DESC' },
    });
  }
}


