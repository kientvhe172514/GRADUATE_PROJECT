import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

/**
 * Scheduled GPS Check Processor
 *
 * Mục đích: Tự động request GPS check từ mobile app trong giờ làm việc
 *
 * Flow:
 * 1. Chạy mỗi giờ (có thể config: mỗi 30 phút, 1 giờ...)
 * 2. Tìm nhân viên đang trong ca làm
 * 3. Gửi silent push qua FCM để trigger background GPS sync
 * 4. Mobile app tự động gửi GPS lên server
 *
 * Configuration:
 * - EVERY_HOUR: Chạy vào đầu mỗi giờ (00 phút)
 * - EVERY_30_MINUTES: Chạy mỗi 30 phút
 * - Custom cron: '0 8-17 * * *' (chỉ chạy 8h-17h)
 */
@Injectable()
export class ScheduledGpsCheckProcessor {
  private readonly logger = new Logger(ScheduledGpsCheckProcessor.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * Chạy vào đầu mỗi giờ (00 phút)
   * Ví dụ: 8:00, 9:00, 10:00, 11:00...
   *
   * Có thể thay đổi thành:
   * - '0,30 * * * *' → Chạy phút 00 và 30 mỗi giờ
   * - '0 8-17 * * 1-5' → Chỉ chạy trong giờ hành chính (8h-17h, thứ 2-6)
   */
  @Cron('0 * * * *', {
    name: 'scheduled-gps-check',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async triggerGpsCheckForActiveShifts() {
    const startTime = new Date();
    this.logger.log(
      `🔍 [GPS-CHECK] Starting scheduled GPS check at ${startTime.toLocaleString('vi-VN')}`,
    );

    try {
      // Tìm nhân viên đang trong ca
      const activeEmployees = await this.findEmployeesInActiveShift();

      if (activeEmployees.length === 0) {
        this.logger.log('✅ [GPS-CHECK] No employees currently in shift');
        return;
      }

      this.logger.log(
        `📊 [GPS-CHECK] Found ${activeEmployees.length} employees in active shifts`,
      );

      // Gửi request GPS check cho từng nhân viên
      let successCount = 0;
      let failCount = 0;

      for (const emp of activeEmployees) {
        try {
          this.requestGpsCheck(emp);
          successCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `❌ Failed to request GPS check for employee ${emp.employee_id}: ${error.message}`,
          );
        }
      }

      const duration = (new Date().getTime() - startTime.getTime()) / 1000;
      this.logger.log(
        `✅ [GPS-CHECK] Completed in ${duration}s. Sent: ${successCount}, Failed: ${failCount}`,
      );
    } catch (error) {
      this.logger.error(`❌ [GPS-CHECK] Error: ${error.message}`, error.stack);
    }
  }

  /**
   * Tìm nhân viên đang trong ca làm hiện tại
   *
   * Điều kiện:
   * - Shift date = hôm nay
   * - Đang trong khoảng thời gian ca (start_time <= NOW <= end_time)
   * - Đã check-in (check_in_time NOT NULL)
   * - Chưa check-out (check_out_time IS NULL)
   * - Employee status = active
   * - Work schedule is_active = true
   */
  private async findEmployeesInActiveShift(): Promise<any[]> {
    const query = `
      SELECT 
        es.employee_id,
        es.shift_id,
        es.shift_date,
        ws.shift_name,
        ws.start_time,
        ws.end_time,
        e.full_name,
        CONCAT(es.shift_date::text, ' ', ws.start_time::text)::timestamp as shift_start,
        CONCAT(es.shift_date::text, ' ', ws.end_time::text)::timestamp as shift_end
      FROM employee_shifts es
      INNER JOIN work_schedules ws ON es.schedule_id = ws.schedule_id
      INNER JOIN employees e ON e.employee_id = es.employee_id
      WHERE 
        es.shift_date = CURRENT_DATE
        AND es.status = 'scheduled'
        AND ws.is_active = true
        AND e.status = 'active'
        -- Đang trong giờ làm việc (start_time <= NOW <= end_time)
        AND NOW() BETWEEN 
          CONCAT(es.shift_date::text, ' ', ws.start_time::text)::timestamp 
          AND CONCAT(es.shift_date::text, ' ', ws.end_time::text)::timestamp
        -- Đã check-in (chỉ check GPS cho người đã vào làm)
        AND es.check_in_time IS NOT NULL
        -- Chưa check-out
        AND es.check_out_time IS NULL
      ORDER BY es.employee_id;
    `;

    return await this.dataSource.query(query);
  }

  /**
   * Gửi request GPS check qua Notification Service (silent push)
   *
   * Event: 'notification.request_gps_check'
   * Notification Service sẽ gửi DATA MESSAGE (silent push) qua FCM
   * Mobile app nhận message → Wake background service → Tự động gửi GPS
   */
  private requestGpsCheck(employee: any): void {
    const payload = {
      type: 'GPS_CHECK_REQUEST',
      recipientId: employee.employee_id,
      metadata: {
        shiftId: employee.shift_id,
        shiftName: employee.shift_name,
        shiftStart: employee.shift_start,
        shiftEnd: employee.shift_end,
        timestamp: new Date().toISOString(),
        action: 'BACKGROUND_GPS_SYNC',
      },
    };

    // Emit event qua RabbitMQ để Notification Service xử lý
    this.notificationClient.emit('notification.request_gps_check', payload);

    this.logger.debug(
      `📍 Requested GPS check for ${employee.full_name} (ID: ${employee.employee_id}) - Shift: ${employee.shift_name}`,
    );
  }

  /**
   * Manual trigger cho testing/admin panel
   *
   * Usage: Gọi từ controller hoặc admin dashboard
   */
  async triggerManually(): Promise<{
    sent: number;
    failed: number;
    employees: any[];
  }> {
    this.logger.log('🔧 [MANUAL] Manually triggered GPS check');

    const employees = await this.findEmployeesInActiveShift();

    let successCount = 0;
    let failCount = 0;

    for (const emp of employees) {
      try {
        this.requestGpsCheck(emp);
        successCount++;
      } catch {
        failCount++;
      }
    }

    return {
      sent: successCount,
      failed: failCount,
      employees: employees.map((e) => ({
        employeeId: e.employee_id,
        fullName: e.full_name,
        shiftName: e.shift_name,
      })),
    };
  }
}
