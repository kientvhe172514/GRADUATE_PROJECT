import { LeaveTypeEntity } from '../../domain/entities/leave-type.entity';

export interface ILeaveTypeRepository {
  findAll(): Promise<LeaveTypeEntity[]>;
  findFiltered(status?: string, isPaid?: boolean): Promise<LeaveTypeEntity[]>;
  findById(id: number): Promise<LeaveTypeEntity | null>;
  findByCode(code: string): Promise<LeaveTypeEntity | null>;
  findActive(): Promise<LeaveTypeEntity[]>;
  create(leaveType: Partial<LeaveTypeEntity>): Promise<LeaveTypeEntity>;
  update(id: number, leaveType: Partial<LeaveTypeEntity>): Promise<LeaveTypeEntity>;
  delete(id: number): Promise<void>;
}
