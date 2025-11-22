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
  shift_type?: string; // 'REGULAR' or 'OVERTIME'
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
      shift_type: dto.shift_type || 'REGULAR',
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
    shiftType?: string,
  ): Promise<EmployeeShiftSchema | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const queryBuilder = this.repository
      .createQueryBuilder('shift')
      .where('shift.employee_id = :employeeId', { employeeId })
      .andWhere('shift.shift_date BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      });

    if (shiftType) {
      queryBuilder.andWhere('shift.shift_type = :shiftType', { shiftType });
    }

    return queryBuilder.getOne();
  }

  async findOTShiftByEmployeeAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShiftSchema | null> {
    return this.findByEmployeeAndDate(employeeId, date, 'OVERTIME');
  }

  async findRegularShiftByEmployeeAndDate(
    employeeId: number,
    date: Date,
  ): Promise<EmployeeShiftSchema | null> {
    return this.findByEmployeeAndDate(employeeId, date, 'REGULAR');
  }

  /**
   * Find active shift at specific time (handles multiple shifts per day)
   * Logic:
   * 1. Get all shifts of employee on given date
   * 2. Filter shifts where current_time is within ±2 hours of shift start/end time
   * 3. Priority: OVERTIME > REGULAR (if multiple shifts match)
   * 4. Return the closest shift to current time
   */
  async findActiveShiftByTime(
    employeeId: number,
    date: Date,
    currentTime: string, // Format: "HH:MM"
  ): Promise<EmployeeShiftSchema | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all shifts of employee on this date
    const allShifts = await this.repository.find({
      where: {
        employee_id: employeeId,
        shift_date: startOfDay,
      },
      order: {
        scheduled_start_time: 'ASC',
      },
    });

    if (allShifts.length === 0) {
      return null;
    }

    // If only one shift, return it
    if (allShifts.length === 1) {
      return allShifts[0];
    }

    // Multiple shifts - find the one closest to current time
    // Allow check-in up to 2 hours before shift start and check-out up to 2 hours after shift end
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    let bestShift: EmployeeShiftSchema | null = null;
    let smallestDiff = Infinity;

    for (const shift of allShifts) {
      const [startHour, startMinute] = shift.scheduled_start_time
        .split(':')
        .map(Number);
      const startMinutes = startHour * 60 + startMinute;

      const [endHour, endMinute] = shift.scheduled_end_time
        .split(':')
        .map(Number);
      const endMinutes = endHour * 60 + endMinute;

      // Allow check-in 2 hours early, check-out 2 hours late
      const allowedStartMinutes = startMinutes - 120; // 2 hours before
      const allowedEndMinutes = endMinutes + 120; // 2 hours after

      // Check if current time is within allowed range
      if (
        currentMinutes >= allowedStartMinutes &&
        currentMinutes <= allowedEndMinutes
      ) {
        // Calculate distance to shift start time
        const diff = Math.abs(currentMinutes - startMinutes);

        // Prefer OVERTIME shift if same distance
        if (
          diff < smallestDiff ||
          (diff === smallestDiff && shift.shift_type === 'OVERTIME')
        ) {
          smallestDiff = diff;
          bestShift = shift;
        }
      }
    }

    return bestShift;
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
