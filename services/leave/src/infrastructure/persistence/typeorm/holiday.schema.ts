import { EntitySchema } from 'typeorm';
import { HolidayEntity } from '../../../domain/entities/holiday.entity';

export const HolidaySchema = new EntitySchema<HolidayEntity>({
  name: 'Holiday',
  tableName: 'holidays',
  columns: {
    id: { type: 'int', primary: true, generated: true },
    holiday_name: { type: 'varchar', length: 255 },
    holiday_date: { type: 'date' },
    holiday_type: { type: 'varchar', length: 50 },
    applies_to: { type: 'varchar', length: 20, default: 'ALL' },
    department_ids: { type: 'text', nullable: true },
    location_ids: { type: 'text', nullable: true },
    is_recurring: { type: 'boolean', default: false },
    recurring_month: { type: 'int', nullable: true },
    recurring_day: { type: 'int', nullable: true },
    recurring_rule: { type: 'varchar', length: 50, nullable: true },
    is_mandatory: { type: 'boolean', default: true },
    is_paid: { type: 'boolean', default: true },
    can_work_for_ot: { type: 'boolean', default: false },
    description: { type: 'text', nullable: true },
    year: { type: 'int' },
    status: { type: 'varchar', length: 20, default: 'ACTIVE' },
    created_at: { type: 'timestamp', createDate: true },
    updated_at: { type: 'timestamp', updateDate: true },
  },
  indices: [
    { columns: ['holiday_date'] },
    { columns: ['year'] },
    { columns: ['holiday_type'] },
  ],
});
