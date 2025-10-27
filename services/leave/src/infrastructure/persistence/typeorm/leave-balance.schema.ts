import { EntitySchema } from 'typeorm';
import { LeaveBalanceEntity } from '../../../domain/entities/leave-balance.entity';

export const LeaveBalanceSchema = new EntitySchema<LeaveBalanceEntity>({
  name: 'LeaveBalance',
  tableName: 'employee_leave_balances',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    employee_id: { type: 'bigint' },
    leave_type_id: { type: 'int' },
    year: { type: 'int' },
    total_days: { type: 'decimal', precision: 5, scale: 2 },
    used_days: { type: 'decimal', precision: 5, scale: 2, default: 0 },
    pending_days: { type: 'decimal', precision: 5, scale: 2, default: 0 },
    remaining_days: { type: 'decimal', precision: 5, scale: 2 },
    carried_over_days: { type: 'decimal', precision: 5, scale: 2, default: 0 },
    adjusted_days: { type: 'decimal', precision: 5, scale: 2, default: 0 },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
  indices: [
    { columns: ['employee_id', 'year'] },
  ],
  uniques: [
    { columns: ['employee_id', 'leave_type_id', 'year'] },
  ],
});
