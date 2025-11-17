import { Injectable } from '@nestjs/common';
import { IEmployeeShiftRepository } from '../../application/ports/employee-shift.repository.port';
import { EmployeeShiftEntity } from '../../domain/entities/employee-shift.entity';
import { EmployeeShiftRepository } from './employee-shift.repository';

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

  async findByEmployeeIdAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShiftEntity | null> {
    const schema = await this.repository.findByEmployeeAndDate(
      employeeId,
      date,
    );

    if (!schema) return null;

    // Map schema to domain entity
    return new EmployeeShiftEntity({
      id: schema.id,
      employee_id: schema.employee_id,
      actual_check_in: schema.check_in_time,
      actual_check_out: schema.check_out_time,
      status: schema.status as any,
      shift_date: schema.shift_date,
      start_time: schema.scheduled_start_time,
      end_time: schema.scheduled_end_time,
    });
  }

  async findByStatus(status: string): Promise<EmployeeShiftEntity[]> {
    const schemas = await this.repository.findByStatus(status);

    return schemas.map(
      (schema) =>
        new EmployeeShiftEntity({
          id: schema.id,
          employee_id: schema.employee_id,
          actual_check_in: schema.check_in_time,
          actual_check_out: schema.check_out_time,
          status: schema.status as any,
          shift_date: schema.shift_date,
          start_time: schema.scheduled_start_time,
          end_time: schema.scheduled_end_time,
        }),
    );
  }

  async findById(id: number): Promise<EmployeeShiftEntity | null> {
    const schema = await this.repository.findById(id);

    if (!schema) return null;

    return new EmployeeShiftEntity({
      id: schema.id,
      employee_id: schema.employee_id,
      actual_check_in: schema.check_in_time,
      actual_check_out: schema.check_out_time,
      status: schema.status as any,
      shift_date: schema.shift_date,
      start_time: schema.scheduled_start_time,
      end_time: schema.scheduled_end_time,
    });
  }

  async findActiveShifts(): Promise<EmployeeShiftEntity[]> {
    const schemas = await this.repository.findByStatus('ACTIVE');

    return schemas.map(
      (schema) =>
        new EmployeeShiftEntity({
          id: schema.id,
          employee_id: schema.employee_id,
          actual_check_in: schema.check_in_time,
          actual_check_out: schema.check_out_time,
          status: schema.status as any,
          shift_date: schema.shift_date,
          start_time: schema.scheduled_start_time,
          end_time: schema.scheduled_end_time,
        }),
    );
  }

  async create(shift: EmployeeShiftEntity): Promise<EmployeeShiftEntity> {
    throw new Error(
      'Create not implemented in adapter - use original repository',
    );
  }

  async update(
    id: number,
    data: Partial<EmployeeShiftEntity>,
  ): Promise<EmployeeShiftEntity> {
    throw new Error(
      'Update not implemented in adapter - use original repository',
    );
  }
}
