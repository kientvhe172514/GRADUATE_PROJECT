import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

/**
 * Scheduled GPS Check Processor - IMPROVED VERSION
 *
 * Mục đích: Tự động request GPS check từ mobile app trong giờ làm việc
 *
 * IMPROVEMENTS:
 * 1. ✅ Dynamic scheduling: Chạy mỗi 15 phút thay vì fix cứng mỗi giờ
 * 2. ✅ Smart checking: Query shift configuration để biết cần check bao nhiêu lần
 * 3. ✅ Avoid over-checking: Track số lần đã check hôm nay, chỉ check khi cần
 * 4. ✅ Flexible: Dựa trên gps_check_configurations để tính toán
 *
 * Flow:
 * 1. Chạy mỗi 15 phút
 * 2. Tìm nhân viên đang trong ca làm
 * 3. Check xem đã đủ số lần GPS check chưa (dựa vào config)
 * 4. Nếu chưa đủ → Gửi request GPS check
 * 5. Mobile app tự động gửi GPS lên server
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
   * Chạy mỗi 15 phút để check GPS cho nhân viên đang trong ca
   *
   * IMPROVED: Không còn fix cứng mỗi giờ, giờ chạy thường xuyên hơn
   * và có logic thông minh để quyết định có cần check GPS không
   */
  @Cron('*/15 * * * *', {
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
   * IMPROVED:
   * - Query thêm thông tin presence_verification_rounds_required và completed
   * - Để biết cần check bao nhiêu lần và đã check bao nhiêu lần rồi
   * - Chỉ gửi request nếu chưa đủ số lần check
   *
   * Điều kiện:
   * - Shift date = hôm nay
   * - Đang trong khoảng thời gian ca (start_time <= NOW <= end_time)
   * - Đã check-in (check_in_time NOT NULL)
   * - Chưa check-out (check_out_time IS NULL)
   * - presence_verification_rounds_completed < presence_verification_rounds_required
   */
  private async findEmployeesInActiveShift(): Promise<any[]> {
    const query = `
      SELECT 
        es.id as shift_id,
        es.employee_id,
        es.employee_code,
        es.shift_date,
        es.scheduled_start_time,
        es.scheduled_end_time,
        es.shift_type,
        es.check_in_time,
        es.presence_verification_rounds_required,
        es.presence_verification_rounds_completed,
        CONCAT(es.shift_date::text, ' ', es.scheduled_start_time::text)::timestamp as shift_start,
        CONCAT(es.shift_date::text, ' ', es.scheduled_end_time::text)::timestamp as shift_end
      FROM employee_shifts es
      WHERE 
        es.shift_date = CURRENT_DATE
        AND es.status IN ('IN_PROGRESS', 'SCHEDULED')
        -- Đang trong giờ làm việc
        AND NOW() BETWEEN 
          CONCAT(es.shift_date::text, ' ', es.scheduled_start_time::text)::timestamp 
          AND CONCAT(es.shift_date::text, ' ', es.scheduled_end_time::text)::timestamp
        -- Đã check-in
        AND es.check_in_time IS NOT NULL
        -- Chưa check-out
        AND es.check_out_time IS NULL
        -- Cần GPS check
        AND es.presence_verification_required = true
        -- Chưa đủ số lần check
        AND es.presence_verification_rounds_completed < es.presence_verification_rounds_required
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
        shiftType: employee.shift_type,
        scheduledStartTime: employee.scheduled_start_time,
        scheduledEndTime: employee.scheduled_end_time,
        shiftStart: employee.shift_start,
        shiftEnd: employee.shift_end,
        roundsRequired: employee.presence_verification_rounds_required,
        roundsCompleted: employee.presence_verification_rounds_completed,
        timestamp: new Date().toISOString(),
        action: 'BACKGROUND_GPS_SYNC',
      },
    };

    // Emit event qua RabbitMQ để Notification Service xử lý
    this.notificationClient.emit('notification.request_gps_check', payload);

    this.logger.debug(
      `📍 GPS check ${employee.presence_verification_rounds_completed + 1}/${employee.presence_verification_rounds_required} for employee ${employee.employee_code} (shift_id: ${employee.shift_id})`,
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
