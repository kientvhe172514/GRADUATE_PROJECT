import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

@Controller()
export class ShiftCheckController {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * RPC Handler: Check if employee has active shift and can change device
   * 
   * Called by Auth Service during login to prevent device switching during shift
   */
  @MessagePattern({ cmd: 'check_active_shift_for_device_change' })
  async checkActiveShiftForDeviceChange(
    @Payload() data: { employee_id: number },
  ): Promise<{
    has_active_shift: boolean;
    shift_id?: number;
    status?: string;
    check_in_time?: Date;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    time_until_shift_start_hours?: number;
  }> {
    const { employee_id } = data;

    // Query to find active or upcoming shift
    const query = `
      WITH active_shifts AS (
        SELECT 
          id,
          status,
          check_in_time,
          scheduled_start_time,
          scheduled_end_time,
          shift_date,
          -- Calculate shift start timestamp
          (shift_date::text || ' ' || scheduled_start_time)::timestamp as shift_start_ts,
          -- Current Vietnam time
          NOW() + INTERVAL '7 hours' as current_vn_time
        FROM employee_shifts
        WHERE employee_id = $1
          AND shift_date = (NOW() + INTERVAL '7 hours')::date
          AND status IN ('SCHEDULED', 'IN_PROGRESS')
        ORDER BY scheduled_start_time
        LIMIT 1
      )
      SELECT 
        id as shift_id,
        status,
        check_in_time,
        scheduled_start_time,
        scheduled_end_time,
        -- Calculate hours until shift starts
        EXTRACT(EPOCH FROM (shift_start_ts - current_vn_time)) / 3600 as time_until_shift_start_hours
      FROM active_shifts;
    `;

    const result = await this.dataSource.query(query, [employee_id]);

    if (!result || result.length === 0) {
      return {
        has_active_shift: false,
      };
    }

    const shift = result[0];

    return {
      has_active_shift: true,
      shift_id: shift.shift_id,
      status: shift.status,
      check_in_time: shift.check_in_time,
      scheduled_start_time: shift.scheduled_start_time,
      scheduled_end_time: shift.scheduled_end_time,
      time_until_shift_start_hours: parseFloat(
        shift.time_until_shift_start_hours || '0',
      ),
    };
  }
}
