import { Injectable } from '@nestjs/common';
import { IEmployeeShiftRepository } from '../../application/ports/employee-shift.repository.port';
import {
  EmployeeShift,
  EmployeeShiftProps,
} from '../../domain/entities/employee-shift.entity';
import { EmployeeShiftRepository } from './employee-shift.repository';
import { EmployeeShiftSchema } from '../persistence/typeorm/employee-shift.schema';

/**
 * Adapter: Adapts existing EmployeeShiftRepository to IEmployeeShiftRepository interface
 *
 * This allows the existing repository to work with new Clean Architecture use cases
 */
@Injectable()
export class EmployeeShiftRepositoryAdapter
  implements IEmployeeShiftRepository
{
  constructor(private readonly repository: EmployeeShiftRepository) {}

  private mapSchemaToDomain(schema: EmployeeShiftSchema): EmployeeShift {
    const props: EmployeeShiftProps = {
      id: schema.id,
      employee_id: schema.employee_id,
      employee_code: schema.employee_code,
      department_id: schema.department_id,
      shift_date: schema.shift_date,
      work_schedule_id: schema.work_schedule_id ?? 0,
      shift_type: schema.shift_type as any,
      scheduled_start_time: schema.scheduled_start_time,
      scheduled_end_time: schema.scheduled_end_time,
      check_in_time: schema.check_in_time,
      check_in_record_id: schema.check_in_record_id,
      check_out_time: schema.check_out_time,
      check_out_record_id: schema.check_out_record_id,
      work_hours: schema.work_hours,
      overtime_hours: schema.overtime_hours,
      break_hours: schema.break_hours,
      late_minutes: schema.late_minutes,
      early_leave_minutes: schema.early_leave_minutes,
      status: schema.status as any,
      notes: schema.notes,
      is_manually_edited: schema.is_manually_edited,
      created_at: schema.created_at,
      updated_at: schema.updated_at,
    };
    return new EmployeeShift(props);
  }

  async findByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShift | null> {
    const schema = await this.repository.findByEmployeeAndDate(
      employeeId,
      date,
    );
    if (!schema) return null;
    return this.mapSchemaToDomain(schema);
  }

  async findByStatus(status: string): Promise<EmployeeShift[]> {
    const schemas = await this.repository.findByStatus(status);
    return schemas.map(this.mapSchemaToDomain);
  }

  async findById(id: number): Promise<EmployeeShift | null> {
    const schema = await this.repository.findById(id);
    if (!schema) return null;
    return this.mapSchemaToDomain(schema);
  }

  async findActiveShifts(): Promise<EmployeeShift[]> {
    const schemas = await this.repository.findByStatus('IN_PROGRESS');
    return schemas.map(this.mapSchemaToDomain);
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<EmployeeShift[]> {
    const schemas = await this.repository.findByDateRange(startDate, endDate);
    return schemas.map(this.mapSchemaToDomain);
  }

  async create(shift: EmployeeShift): Promise<EmployeeShift> {
    // This adapter is read-only for now. Write operations should be handled by a new TypeORM repository.
    throw new Error(
      'Create not implemented in adapter. Use a dedicated TypeORM repository for write operations.',
    );
  }

  async update(
    id: number,
    data: Partial<EmployeeShift>,
  ): Promise<EmployeeShift> {
    // This adapter is read-only for now. Write operations should be handled by a new TypeORM repository.
    throw new Error(
      'Update not implemented in adapter. Use a dedicated TypeORM repository for write operations.',
    );
  }
}
