import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveBalanceEntity } from '../../../domain/entities/leave-balance.entity';
import { ILeaveBalanceRepository } from '../../../application/ports/leave-balance.repository.interface';
import { LeaveBalanceSchema } from '../typeorm/leave-balance.schema';

@Injectable()
export class PostgresLeaveBalanceRepository implements ILeaveBalanceRepository {
  constructor(
    @InjectRepository(LeaveBalanceSchema)
    private readonly repository: Repository<LeaveBalanceEntity>,
  ) {}

  async findByEmployeeAndYear(employeeId: number | null, year: number): Promise<LeaveBalanceEntity[]> {
    if (employeeId === null) {
      // Return all balances for the year (used for batch operations like accrual)
      return this.repository.find({ 
        where: { year },
        order: { id: 'ASC' }
      });
    }
    // Return balances for specific employee
    return this.repository.find({ 
      where: { employee_id: employeeId, year },
      order: { id: 'ASC' }
    });
  }

  async findByLeaveTypeAndYear(leaveTypeId: number, year: number): Promise<LeaveBalanceEntity[]> {
    return this.repository.find({
      where: { leave_type_id: leaveTypeId, year },
      order: { id: 'ASC' }
    });
  }

  async findByEmployeeLeaveTypeAndYear(
    employeeId: number, 
    leaveTypeId: number, 
    year: number
  ): Promise<LeaveBalanceEntity | null> {
    return this.repository.findOne({ 
      where: { employee_id: employeeId, leave_type_id: leaveTypeId, year }
    });
  }

  async create(balance: Partial<LeaveBalanceEntity>): Promise<LeaveBalanceEntity> {
    const entity = this.repository.create(balance);
    return this.repository.save(entity);
  }

  async update(id: number, balance: Partial<LeaveBalanceEntity>): Promise<LeaveBalanceEntity> {
    await this.repository.update(id, balance);
    const updated = await this.repository.findOne({ where: { id } });
    if (!updated) {
      throw new Error('Leave balance not found after update');
    }
    return updated;
  }

  async updateBalance(
    id: number, 
    usedDays: number, 
    pendingDays: number, 
    remainingDays: number
  ): Promise<void> {
    await this.repository.update(id, {
      used_days: usedDays,
      pending_days: pendingDays,
      remaining_days: remainingDays,
    });
  }
}
