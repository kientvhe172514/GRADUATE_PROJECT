import { TimesheetEntryEntity } from '../../domain/entities/timesheet-entry.entity';

export interface ITimesheetEntryRepository {
  findAll(filters?: any): Promise<TimesheetEntryEntity[]>;
  findById(id: number): Promise<TimesheetEntryEntity | null>;
  findByEmployeeAndDateRange(employeeId: number, startDate: Date, endDate: Date): Promise<TimesheetEntryEntity[]>;
  findByDepartmentAndMonth(departmentId: number, year: number, month: number): Promise<TimesheetEntryEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<TimesheetEntryEntity[]>;
  create(entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity>;
  update(id: number, entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity>;
  upsert(entry: Partial<TimesheetEntryEntity>): Promise<TimesheetEntryEntity>;
}
