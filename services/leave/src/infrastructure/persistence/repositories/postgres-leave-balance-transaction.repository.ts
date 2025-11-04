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

  async create(transaction: Partial<LeaveBalanceTransactionEntity>): Promise<LeaveBalanceTransactionEntity> {
    const entity = this.repository.create(transaction);
    return this.repository.save(entity);
  }

  async findByEmployeeAndYear(employeeId: number, year: number): Promise<LeaveBalanceTransactionEntity[]> {
    return this.repository.find({
      where: { employee_id: employeeId, year },
      order: { created_at: 'DESC' },
    });
  }

  async findByEmployeeLeaveTypeAndYear(
    employeeId: number,
    leaveTypeId: number,
    year: number
  ): Promise<LeaveBalanceTransactionEntity[]> {
    return this.repository.find({
      where: {
        employee_id: employeeId,
        leave_type_id: leaveTypeId,
        year,
      },
      order: { created_at: 'DESC' },
    });
  }
}
