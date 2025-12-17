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
  status?: string;
  notes?: string;
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
   * Find shift by employee, date, and time range
   * Used to check if a shift with same time range already exists (for multiple shifts per day)
   * @param employeeId
   * @param date
   * @param startTime Format: HH:mm:ss
   * @param endTime Format: HH:mm:ss
   * @param shiftType 'REGULAR' or 'OVERTIME'
   * @returns Existing shift or null
   */
  async findShiftByEmployeeDateAndTime(
    employeeId: number,
    date: Date,
    startTime: string,
    endTime: string,
    shiftType: string = 'REGULAR',
  ): Promise<EmployeeShiftSchema | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository
      .createQueryBuilder('shift')
      .where('shift.employee_id = :employeeId', { employeeId })
      .andWhere('shift.shift_date BETWEEN :startOfDay AND :endOfDay', {
        startOfDay,
        endOfDay,
      })
      .andWhere('shift.shift_type = :shiftType', { shiftType })
      .andWhere('shift.scheduled_start_time = :startTime', { startTime })
      .andWhere('shift.scheduled_end_time = :endTime', { endTime })
      .getOne();
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

    // Multiple shifts - apply SMART matching logic
    // Priority:
    // 1. If previous shift is NOT completed (no check-out or within grace) → Continue that shift
    // 2. If previous shift is completed → Move to next shift
    // 3. OVERTIME shift has higher priority than REGULAR
    // 4. Allow check-in 2 hours early, check-out 1 hour late

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const currentMinutes = currentHour * 60 + currentMinute;

    let candidateShifts: Array<{
      shift: EmployeeShiftSchema;
      priority: number;
      diff: number;
    }> = [];

    for (const shift of allShifts) {
      const [startHour, startMinute] = shift.scheduled_start_time
        .split(':')
        .map(Number);
      const startMinutes = startHour * 60 + startMinute;

      const [endHour, endMinute] = shift.scheduled_end_time
        .split(':')
        .map(Number);
      let endMinutes = endHour * 60 + endMinute;

      // Handle overnight shift (e.g., 22:00 → 02:00)
      const isOvernightShift = endMinutes < startMinutes;
      if (isOvernightShift) {
        endMinutes += 1440; // Add 24 hours
      }

      // Adjust current time for overnight shift comparison
      let adjustedCurrentMinutes = currentMinutes;
      if (isOvernightShift && currentHour < 6) {
        adjustedCurrentMinutes += 1440;
      }

      // Check if shift is completed (has check-out AND past grace period)
      const hasCheckOut = !!shift.check_out_time;
      const gracePeriodMinutes = 60; // 1 hour grace after shift end
      const shiftEndWithGrace = endMinutes + gracePeriodMinutes;
      const isCompleted =
        hasCheckOut && adjustedCurrentMinutes > shiftEndWithGrace;

      // If shift is completed, skip it (move to next shift)
      if (isCompleted) {
        continue;
      }

      // ✅ BUSINESS RULES:
      // Check-in: 2h before to 1h after shift start (e.g., 8h shift → 6h-9h)
      // Check-out: 30min before to 1h after shift end (e.g., 12h end → 11:30-13h)

      const checkInStart = startMinutes - 120; // 2h before start
      const checkInEnd = startMinutes + 60; // 1h after start
      const checkOutStart = endMinutes - 30; // 30min before end
      const checkOutEnd = endMinutes + 60; // 1h after end

      // Case 1: Shift has check-in but no check-out → Priority for check-out
      if (shift.check_in_time && !shift.check_out_time) {
        if (
          adjustedCurrentMinutes >= checkOutStart &&
          adjustedCurrentMinutes <= checkOutEnd
        ) {
          candidateShifts.push({
            shift,
            priority: 100, // Highest priority - continue existing shift for check-out
            diff: Math.abs(adjustedCurrentMinutes - endMinutes),
          });
        }
        continue; // Don't consider for check-in
      }

      // Case 2: Shift has NO check-in → Available for check-in
      if (!shift.check_in_time) {
        if (
          adjustedCurrentMinutes >= checkInStart &&
          adjustedCurrentMinutes <= checkInEnd
        ) {
          let priority = 50; // Base priority for check-in
          if (shift.shift_type === 'OVERTIME') {
            priority += 10; // OVERTIME bonus
          }
          const diff = Math.abs(adjustedCurrentMinutes - startMinutes);
          candidateShifts.push({ shift, priority, diff });
        }
        // else: Outside check-in window → Shift is MISSED → Skip
      }
    }

    if (candidateShifts.length === 0) {
      return null;
    }

    // Sort by priority (desc), then by diff (asc)
    candidateShifts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.diff - b.diff; // Closer to start time first
    });

    return candidateShifts[0].shift;
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

  /**
   * Find shifts for a specific employee in a date range
   */
  async findByEmployeeAndDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<EmployeeShiftSchema[]> {
    return this.repository.find({
      where: {
        employee_id: employeeId,
        shift_date: Between(startDate, endDate),
      },
      order: {
        shift_date: 'ASC',
        scheduled_start_time: 'ASC',
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

  /**
   * Delete all future shifts for a specific assignment
   * Used when removing an assignment or updating its effective dates
   */
  async deleteFutureShiftsByAssignment(
    employeeId: number,
    workScheduleId: number,
    fromDate: Date,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(EmployeeShiftSchema)
      .where('employee_id = :employeeId', { employeeId })
      .andWhere('work_schedule_id = :workScheduleId', { workScheduleId })
      .andWhere('shift_date >= :fromDate', { fromDate })
      .andWhere('check_in_time IS NULL') // Only delete shifts not yet started
      .execute();

    return result.affected || 0;
  }

  /**
   * Delete specific shift by ID
   */
  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * Delete shifts by employee in date range
   */
  async deleteByEmployeeAndDateRange(
    employeeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .from(EmployeeShiftSchema)
      .where('employee_id = :employeeId', { employeeId })
      .andWhere('shift_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('check_in_time IS NULL')
      .execute();

    return result.affected || 0;
  }

  /**
   * Find shifts for multiple employees in a date range
   * Used for calendar view
   */
  async findByEmployeeIdsAndDateRange(
    employeeIds: number[],
    startDate: Date,
    endDate: Date,
  ): Promise<EmployeeShiftSchema[]> {
    if (employeeIds.length === 0) {
      return [];
    }

    return this.repository
      .createQueryBuilder('shift')
      .where('shift.employee_id IN (:...employeeIds)', { employeeIds })
      .andWhere('shift.shift_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('shift.employee_id', 'ASC')
      .addOrderBy('shift.shift_date', 'ASC')
      .addOrderBy('shift.scheduled_start_time', 'ASC')
      .getMany();
  }

  /**
   * 🆕 Find CURRENT active shift for GPS check (SAME logic as cron job)
   * 
   * ĐÚNG THEO LOGIC CRON: scheduled-gps-check.processor.ts
   * 
   * Điều kiện BẮT BUỘC:
   * 1. Đã check-in (check_in_time NOT NULL)
   * 2. Chưa check-out (check_out_time IS NULL)
   * 3. Shift date trong khoảng [hôm qua, hôm nay] (xử lý ca đêm)
   * 4. Thời gian hiện tại TRONG khoảng [shift_start_ts, shift_end_ts]
   * 
   * XỬ LÝ CA ĐÊM:
   * - Ca đêm: scheduled_end_time < scheduled_start_time (VD: 22:00 → 06:00)
   * - shift_end_ts = shift_date + 1 day + scheduled_end_time
   * 
   * @param employeeId Employee ID
   * @returns Active shift đang diễn ra NGAY BÂY GIỜ, hoặc null nếu không có
   */
  async findCurrentActiveShiftForGpsCheck(
    employeeId: number,
  ): Promise<EmployeeShiftSchema | null> {
    // Raw SQL query - ĐỒNG BỘ với cron job
    const query = `
      WITH calculated_shifts AS (
        SELECT 
          es.*,
          -- Tính shift_start_ts
          (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp as shift_start_ts,
          
          -- Tính shift_end_ts (xử lý ca đêm)
          CASE 
            WHEN es.scheduled_end_time::time < es.scheduled_start_time::time 
            THEN ((es.shift_date + INTERVAL '1 day')::date::text || ' ' || es.scheduled_end_time)::timestamp
            ELSE (es.shift_date::text || ' ' || es.scheduled_end_time)::timestamp
          END as shift_end_ts,
          
          -- Thời gian hiện tại VN
          NOW() + INTERVAL '7 hours' as current_vn_time
          
        FROM employee_shifts es
        WHERE 
          es.employee_id = $1
          -- Shift date trong khoảng [hôm qua, hôm nay] (xử lý ca đêm)
          AND es.shift_date >= (NOW() + INTERVAL '7 hours')::date - INTERVAL '1 day'
          AND es.shift_date <= (NOW() + INTERVAL '7 hours')::date
          -- ✅ ĐÃ CHECK-IN
          AND es.check_in_time IS NOT NULL
          -- ✅ CHƯA CHECK-OUT
          AND es.check_out_time IS NULL
      )
      SELECT 
        id, employee_id, employee_code, department_id, shift_date,
        work_schedule_id, scheduled_start_time, scheduled_end_time,
        shift_type, check_in_time, check_in_record_id, check_out_time,
        check_out_record_id, work_hours, overtime_hours, break_hours,
        late_minutes, early_leave_minutes, presence_verified,
        presence_verification_required, presence_verification_rounds_required,
        presence_verification_rounds_completed, status, notes,
        created_at, updated_at
      FROM calculated_shifts
      WHERE 
        -- ✅ ĐANG TRONG CA (current_vn_time BETWEEN shift_start_ts AND shift_end_ts)
        current_vn_time BETWEEN shift_start_ts AND shift_end_ts
      ORDER BY shift_date DESC, scheduled_start_time DESC
      LIMIT 1
    `;

    const result: any[] = await this.repository.query(query, [employeeId]);

    if (result.length === 0) {
      return null;
    }

    // Convert raw result to EmployeeShiftSchema entity
    // Note: repository.create() returns the object itself (not array) when passed a single object
    const entity = this.repository.create(result[0]);
    return Array.isArray(entity) ? entity[0] : entity;
  }
}
