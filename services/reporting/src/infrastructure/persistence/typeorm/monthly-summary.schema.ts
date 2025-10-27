import { EntitySchema } from 'typeorm';
import { MonthlySummaryEntity } from '../../../domain/entities/monthly-summary.entity';

export const MonthlySummarySchema = new EntitySchema<MonthlySummaryEntity>({
  name: 'MonthlySummary',
  tableName: 'monthly_summaries',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    employee_id: { type: 'bigint' },
    employee_code: { type: 'varchar', length: 50 },
    employee_name: { type: 'varchar', length: 255 },
    department_id: { type: 'int' },
    department_name: { type: 'varchar', length: 255 },
    year: { type: 'int' },
    month: { type: 'int' },
    total_work_days: { type: 'int' },
    actual_work_days: { type: 'int' },
    absent_days: { type: 'int' },
    leave_days: { type: 'decimal', precision: 5, scale: 2, default: 0 },
    holiday_days: { type: 'int', default: 0 },
    total_work_hours: { type: 'decimal', precision: 8, scale: 2, default: 0 },
    total_overtime_hours: { type: 'decimal', precision: 8, scale: 2, default: 0 },
    total_leave_hours: { type: 'decimal', precision: 8, scale: 2, default: 0 },
    late_count: { type: 'int', default: 0 },
    early_leave_count: { type: 'int', default: 0 },
    absent_count: { type: 'int', default: 0 },
    total_late_minutes: { type: 'int', default: 0 },
    attendance_rate: { type: 'decimal', precision: 5, scale: 2, nullable: true },
    punctuality_rate: { type: 'decimal', precision: 5, scale: 2, nullable: true },
    generated_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
  },
  indices: [
    { columns: ['employee_id', 'year', 'month'] },
    { columns: ['department_id', 'year', 'month'] },
  ],
  uniques: [
    { columns: ['employee_id', 'year', 'month'] },
  ],
});
