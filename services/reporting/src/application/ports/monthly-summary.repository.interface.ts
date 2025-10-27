import { MonthlySummaryEntity } from '../../domain/entities/monthly-summary.entity';

export interface IMonthlySummaryRepository {
  findAll(filters?: any): Promise<MonthlySummaryEntity[]>;
  findById(id: number): Promise<MonthlySummaryEntity | null>;
  findByEmployeeAndMonth(employeeId: number, year: number, month: number): Promise<MonthlySummaryEntity | null>;
  findByDepartmentAndMonth(departmentId: number, year: number, month: number): Promise<MonthlySummaryEntity[]>;
  create(summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity>;
  update(id: number, summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity>;
  upsert(summary: Partial<MonthlySummaryEntity>): Promise<MonthlySummaryEntity>;
}
