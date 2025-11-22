import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

@Controller()
export class LeaveRpcHandler {
  constructor(private readonly dataSource: DataSource) {}

  @MessagePattern({ cmd: 'get_employee_leave_days_bulk' })
  async getEmployeeLeaveDaysBulk(
    @Payload() data: { employee_ids: number[]; start_date: string; end_date: string },
  ): Promise<any[]> {
    const { employee_ids, start_date, end_date } = data;

    if (!employee_ids || employee_ids.length === 0) {
      return [];
    }

    const query = `
      SELECT 
        employee_id,
        SUM(total_leave_days) as total_leave_days
      FROM leave_records
      WHERE employee_id = ANY($1)
        AND status = 'APPROVED'
        AND start_date <= $3
        AND end_date >= $2
      GROUP BY employee_id
    `;

    const results = await this.dataSource.query(query, [employee_ids, start_date, end_date]);
    return results;
  }

  @MessagePattern({ cmd: 'get_employee_leaves_by_period' })
  async getEmployeeLeavesByPeriod(
    @Payload() data: { employee_id: number; start_date: string; end_date: string },
  ): Promise<any[]> {
    const { employee_id, start_date, end_date } = data;

    const query = `
      SELECT 
        lr.id,
        lr.employee_id,
        lr.leave_type_id,
        lt.leave_type_name,
        lr.start_date,
        lr.end_date,
        lr.total_leave_days,
        lr.status,
        lr.reason
      FROM leave_records lr
      INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
      WHERE lr.employee_id = $1
        AND lr.status = 'APPROVED'
        AND lr.start_date <= $3
        AND lr.end_date >= $2
      ORDER BY lr.start_date
    `;

    const results = await this.dataSource.query(query, [employee_id, start_date, end_date]);
    return results;
  }
}
