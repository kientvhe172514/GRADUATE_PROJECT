import { EntitySchema } from 'typeorm';
import { LeaveBalanceTransactionEntity } from '../../../domain/entities/leave-balance-transaction.entity';

export const LeaveBalanceTransactionSchema = new EntitySchema<LeaveBalanceTransactionEntity>({
  name: 'LeaveBalanceTransaction',
  tableName: 'leave_balance_transactions',
  columns: {
    id: { type: 'bigint', primary: true, generated: true },
    employee_id: { type: 'bigint' },
    leave_type_id: { type: 'int' },
    year: { type: 'int' },
    transaction_type: { type: 'varchar', length: 50 },
    amount: { type: 'decimal', precision: 5, scale: 2 },
    balance_before: { type: 'decimal', precision: 5, scale: 2 },
    balance_after: { type: 'decimal', precision: 5, scale: 2 },
    reference_type: { type: 'varchar', length: 50, nullable: true },
    reference_id: { type: 'bigint', nullable: true },
    description: { type: 'text', nullable: true },
    created_by: { type: 'bigint', nullable: true },
    created_at: { type: 'timestamp', createDate: true },
  },
  indices: [
    { columns: ['employee_id', 'created_at'] },
    { columns: ['leave_type_id'] },
    { columns: ['year'] },
  ],
});
