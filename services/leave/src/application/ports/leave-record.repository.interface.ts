import { LeaveRecordEntity } from '../../domain/entities/leave-record.entity';

export interface ILeaveRecordRepository {
  findAll(filters?: any): Promise<LeaveRecordEntity[]>;
  findById(id: number): Promise<LeaveRecordEntity | null>;
  findByEmployeeId(employeeId: number): Promise<LeaveRecordEntity[]>;
  findByStatus(status: string): Promise<LeaveRecordEntity[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<LeaveRecordEntity[]>;
  findOverlappingLeaves(
    employeeId: number,
    startDate: Date,
    endDate: Date,
    excludeLeaveId?: number,
  ): Promise<LeaveRecordEntity[]>;
  create(record: Partial<LeaveRecordEntity>): Promise<LeaveRecordEntity>;
  update(id: number, record: Partial<LeaveRecordEntity>): Promise<LeaveRecordEntity>;
  updateStatus(id: number, status: string, approvedBy?: number): Promise<void>;
}
