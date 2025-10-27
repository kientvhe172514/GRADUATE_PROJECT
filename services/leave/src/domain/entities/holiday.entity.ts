export class HolidayEntity {
  id: number;
  holiday_name: string;
  holiday_date: Date;
  holiday_type: string;

  // Scope
  applies_to: string;
  department_ids?: string;
  location_ids?: string;

  // Recurring
  is_recurring: boolean;
  recurring_month?: number;
  recurring_day?: number;
  recurring_rule?: string;

  // Compensation
  is_mandatory: boolean;
  is_paid: boolean;
  can_work_for_ot: boolean;

  description?: string;
  year: number;

  status: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<HolidayEntity>) {
    Object.assign(this, data);
  }
}
