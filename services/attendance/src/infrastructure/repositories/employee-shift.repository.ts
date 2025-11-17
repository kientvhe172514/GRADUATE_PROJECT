import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EmployeeShiftSchema } from '../persistence/typeorm/employee-shift.schema';

export interface CreateShiftDto {
  employee_id: number;
  employee_code: string;
  department_id: number;
  shift_date: Date;
  work_schedule_id?: number;
  scheduled_start_time: string;
  scheduled_end_time: string;
  presence_verification_required: boolean;
  presence_verification_rounds_required: number;
}

export interface UpdateShiftDto {
  check_in_time?: Date;
  check_in_record_id?: number;
  check_out_time?: Date;
  check_out_record_id?: number;
  work_hours?: number;
  overtime_hours?: number;
  break_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  presence_verified?: boolean;
  presence_verification_rounds_completed?: number;
  status?: string;
  notes?: string;
}

@Injectable()
export class EmployeeShiftRepository {
  constructor(
    @InjectRepository(EmployeeShiftSchema)
    private readonly repository: Repository<EmployeeShiftSchema>,
  ) {}

  async create(dto: CreateShiftDto): Promise<EmployeeShiftSchema> {
    const shift = this.repository.create({
      ...dto,
      work_hours: 0,
      overtime_hours: 0,
      break_hours: 1,
      late_minutes: 0,
      early_leave_minutes: 0,
      presence_verified: false,
      presence_verification_rounds_completed: 0,
      is_manually_edited: false,
      status: 'SCHEDULED',
    });
    return this.repository.save(shift);
  }

  async findById(id: number): Promise<EmployeeShiftSchema | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByEmployeeAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShiftSchema | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.findOne({
      where: {
        employee_id: employeeId,
        shift_date: Between(startOfDay, endOfDay),
      },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<EmployeeShiftSchema[]> {
    return this.repository.find({
      where: {
        shift_date: Between(startDate, endDate),
      },
      order: {
        shift_date: 'ASC',
        employee_id: 'ASC',
      },
    });
  }

  async update(
    id: number,
    dto: UpdateShiftDto,
  ): Promise<EmployeeShiftSchema | null> {
    const shift = await this.repository.findOne({ where: { id } });
    if (!shift) {
      return null;
    }

    Object.assign(shift, dto);
    shift.updated_at = new Date();

    return this.repository.save(shift);
  }

  async markPresenceVerified(shiftId: number): Promise<void> {
    await this.repository.update(shiftId, {
      presence_verified: true,
      updated_at: new Date(),
    });
  }

  async findByStatus(status: string): Promise<EmployeeShiftSchema[]> {
    return this.repository.find({
      where: { status },
      order: { shift_date: 'ASC' },
    });
  }

  async findPendingPresenceVerification(): Promise<EmployeeShiftSchema[]> {
    return this.repository.find({
      where: {
        presence_verification_required: true,
        presence_verified: false,
        status: 'IN_PROGRESS',
      },
    });
  }
}
