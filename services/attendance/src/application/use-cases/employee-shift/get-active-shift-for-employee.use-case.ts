import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface GetActiveShiftForEmployeeCommand {
  employee_id: number;
  current_time?: Date; // Optional, defaults to NOW()
}

export interface ActiveShiftResult {
  has_active_shift: boolean;
  shift_id?: number;
  shift_date?: string;
  shift_type?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  check_in_time?: string;
  status?: string;
  hours_before_start?: number;
}

/**
 * Use Case: Get Active Shift for Employee
 * 
 * Purpose: Check if employee has active shift (for device change validation)
 * 
 * Logic:
 * 1. Find shifts with status IN_PROGRESS (already checked in)
 * 2. Find shifts SCHEDULED and starting within next few hours
 * 3. Return shift info + hours before start
 */
@Injectable()
export class GetActiveShiftForEmployeeUseCase {
  private readonly logger = new Logger(GetActiveShiftForEmployeeUseCase.name);

  constructor(private readonly dataSource: DataSource) {}

  async execute(
    command: GetActiveShiftForEmployeeCommand,
  ): Promise<ActiveShiftResult> {
    const currentTime = command.current_time || new Date();

    this.logger.log(
      `Checking active shift for employee_id=${command.employee_id} at ${currentTime.toISOString()}`,
    );

    // Query active shift
    const query = `
      WITH current_time AS (
        SELECT $2::timestamptz as now_time
      ),
      calculated_shifts AS (
        SELECT 
          es.*,
          -- Calculate shift start timestamp
          (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp as shift_start_ts,
          -- Calculate shift end timestamp (handle overnight shifts)
          CASE 
            WHEN es.scheduled_end_time::time < es.scheduled_start_time::time 
            THEN ((es.shift_date + INTERVAL '1 day')::date::text || ' ' || es.scheduled_end_time)::timestamp
            ELSE (es.shift_date::text || ' ' || es.scheduled_end_time)::timestamp
          END as shift_end_ts,
          ct.now_time
        FROM employee_shifts es
        CROSS JOIN current_time ct
        WHERE 
          es.employee_id = $1
          AND es.shift_date = CURRENT_DATE
          AND es.status IN ('SCHEDULED', 'IN_PROGRESS')
      )
      SELECT 
        id as shift_id,
        shift_date,
        shift_type,
        scheduled_start_time,
        scheduled_end_time,
        check_in_time,
        status,
        shift_start_ts,
        shift_end_ts,
        now_time,
        -- Calculate hours before shift starts
        CASE 
          WHEN status = 'IN_PROGRESS' THEN 0
          WHEN now_time < shift_start_ts THEN 
            EXTRACT(EPOCH FROM (shift_start_ts - now_time)) / 3600
          ELSE 0
        END as hours_before_start
      FROM calculated_shifts
      WHERE 
        -- Case 1: Already checked in (IN_PROGRESS)
        status = 'IN_PROGRESS'
        OR
        -- Case 2: Scheduled and starting soon (within next 6 hours)
        (status = 'SCHEDULED' AND shift_start_ts - now_time <= INTERVAL '6 hours')
      ORDER BY 
        CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 2 END,
        shift_start_ts
      LIMIT 1
    `;

    const result = await this.dataSource.query(query, [
      command.employee_id,
      currentTime,
    ]);

    if (!result || result.length === 0) {
      this.logger.log(
        `No active shift found for employee_id=${command.employee_id}`,
      );
      return {
        has_active_shift: false,
      };
    }

    const shift = result[0];
    const hoursBeforeStart = parseFloat(shift.hours_before_start || '0');

    this.logger.log(
      `Found active shift for employee_id=${command.employee_id}: ` +
        `shift_id=${shift.shift_id}, status=${shift.status}, ` +
        `hours_before_start=${hoursBeforeStart.toFixed(2)}h`,
    );

    return {
      has_active_shift: true,
      shift_id: shift.shift_id,
      shift_date: shift.shift_date,
      shift_type: shift.shift_type,
      scheduled_start_time: shift.scheduled_start_time,
      scheduled_end_time: shift.scheduled_end_time,
      check_in_time: shift.check_in_time,
      status: shift.status,
      hours_before_start: hoursBeforeStart,
    };
  }
}
