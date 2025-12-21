import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { DataSource } from 'typeorm';

/**
 * Scheduled GPS Check Processor - RANDOM DELAY VERSION
 *
 * Mục đích: Tự động request GPS check từ mobile app trong giờ làm việc
 *
 * IMPROVEMENTS:
 * 1. ✅ Cron mỗi 1 TIẾNG (thay vì 15 phút)
 * 2. ✅ Random delay 0-60 phút cho mỗi nhân viên
 * 3. ✅ Smart checking: Query shift configuration để biết cần check bao nhiêu lần
 * 4. ✅ Avoid over-checking: Track số lần đã check hôm nay, chỉ check khi cần
 * 5. ✅ Load balancing: Request phân tán đều trong 1 tiếng
 * 6. ✅ Unpredictable: Nhân viên không đoán được khi nào sẽ bị check
 *
 * Flow:
 * 1. Cron chạy mỗi 1 tiếng (00:00, 01:00, 02:00,...)
 * 2. Tìm nhân viên đang trong ca làm
 * 3. Check xem đã đủ số lần GPS check chưa (dựa vào config)
 * 4. Nếu chưa đủ → Schedule GPS request với random delay (0-60 phút)
 * 5. Mobile app tự động gửi GPS lên server khi nhận request
 *
 * Example:
 * - Cron trigger lúc 9:00 AM
 * - Employee A: Random 5 phút → GPS request lúc 9:05
 * - Employee B: Random 23 phút → GPS request lúc 9:23
 * - Employee C: Random 47 phút → GPS request lúc 9:47
 * → Mỗi người nhận request ở thời điểm khác nhau, khó đoán!
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
   * Chạy mỗi 1 TIẾNG để check GPS cho nhân viên đang trong ca
   *
   * IMPROVED: Random delay cho mỗi nhân viên (0-60 phút)
   * → Tránh tất cả nhân viên gửi GPS cùng lúc
   * → Khó đoán cho nhân viên
   * → Giảm tải server
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

      // Gửi request GPS check cho từng nhân viên với RANDOM DELAY
      let successCount = 0;
      let failCount = 0;

      for (const emp of activeEmployees) {
        try {
          // 🎲 Random delay 0-60 phút (0-3600 giây)
          const randomDelayMs = Math.floor(Math.random() * 60 * 60 * 1000);
          const delayMinutes = Math.floor(randomDelayMs / 60000);

          this.logger.debug(
            `⏱️  Employee ${emp.employee_code} will receive GPS request in ${delayMinutes} minutes`,
          );

          // Schedule request với delay
          setTimeout(() => {
            this.requestGpsCheck(emp);
          }, randomDelayMs);

          successCount++;
        } catch (error) {
          failCount++;
          this.logger.error(
            `❌ Failed to schedule GPS check for employee ${emp.employee_id}: ${error.message}`,
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
      WITH calculated_shifts AS (
    SELECT 
        es.*,
        -- 1. Tính thời gian Bắt đầu ca (Shift Start)
        -- Dùng ::text || ' ' || ... tương đương CONCAT, gọn hơn
        (es.shift_date::text || ' ' || es.scheduled_start_time)::timestamp as shift_start_ts,
        
        -- 2. Tính thời gian Kết thúc ca (Shift End) - FIX QUAN TRỌNG
        CASE 
            -- Nếu giờ End < giờ Start (VD: 06:00 < 22:00) => Là ca đêm
            WHEN es.scheduled_end_time::time < es.scheduled_start_time::time 
            THEN (
                -- ✅ FIX CÚ PHÁP: Ép về ::date trước khi ::text để tránh lỗi "00:00:00" chèn vào giữa
                (es.shift_date + INTERVAL '1 day')::date::text || ' ' || es.scheduled_end_time
            )::timestamp
            
            -- Ca thường (trong ngày)
            ELSE (es.shift_date::text || ' ' || es.scheduled_end_time)::timestamp
        END as shift_end_ts,
        
        -- 🔧 DEBUG: Tính giờ hiện tại VN
        NOW() + INTERVAL '7 hours' as current_vn_time
        
    FROM employee_shifts es
    WHERE 
        -- ✅ FIX TIMEZONE: Dùng giờ VN thay vì CURRENT_DATE (UTC)
        -- Lấy ngày hiện tại theo giờ VN
        es.shift_date >= (NOW() + INTERVAL '7 hours')::date - INTERVAL '1 day'
        AND es.shift_date <= (NOW() + INTERVAL '7 hours')::date
)
SELECT 
    id as shift_id,
    employee_id,
    employee_code,
    shift_date,
    scheduled_start_time,
    scheduled_end_time,
    shift_type,
    check_in_time,
    check_out_time,
    status,
    shift_start_ts,
    shift_end_ts,
    current_vn_time,
    -- 🔧 DEBUG: Check xem có trong khoảng thời gian không
    CASE 
        WHEN current_vn_time BETWEEN shift_start_ts AND shift_end_ts THEN 'YES'
        ELSE 'NO'
    END as is_in_time_range,
    presence_verification_rounds_required,
    presence_verification_rounds_completed
FROM calculated_shifts
WHERE 
    presence_verification_required = true
    -- ✅ Chỉ lấy shifts ĐANG TRONG KHOẢNG THỜI GIAN hiện tại
    AND current_vn_time BETWEEN shift_start_ts AND shift_end_ts
    -- ✅ Chỉ track GPS khi đã CHECK-IN và chưa CHECK-OUT (CA ĐANG DIỄN RA)
    AND check_in_time IS NOT NULL
    AND check_out_time IS NULL
    AND status = 'IN_PROGRESS'
    -- ✅ Chưa đủ số lần GPS check theo config
    AND COALESCE(presence_verification_rounds_completed, 0) < presence_verification_rounds_required
ORDER BY employee_id;
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
    // 🔧 FIX: Flatten payload structure - app cần action ở root level
    const payload = {
      type: 'GPS_CHECK_REQUEST',
      action: 'BACKGROUND_GPS_SYNC', // ✅ Move to root level for Flutter app
      recipientId: employee.employee_id,
      silent: true,
      shiftId: employee.shift_id, // ✅ Also at root for easy access
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
      },
    };

    // Emit event qua RabbitMQ để Notification Service xử lý
    this.notificationClient.emit('notification.request_gps_check', payload);

    this.logger.log(
      `📤 [GPS-CHECK] Emitted event 'notification.request_gps_check' for employee ${employee.employee_id}`,
    );
    this.logger.debug(`   Payload: ${JSON.stringify(payload, null, 2)}`);

    this.logger.debug(
      `📍 GPS check ${employee.presence_verification_rounds_completed + 1}/${employee.presence_verification_rounds_required} for employee ${employee.employee_code} (shift_id: ${employee.shift_id})`,
    );
  }

  /**
   * Manual trigger cho testing/admin panel
   *
   * @param useRandomDelay - true = random delay như cron (default), false = gửi ngay lập tức cho TEST
   *
   * Usage:
   * - Testing: triggerManually(false) → Gửi ngay, không random
   * - Production: triggerManually(true) → Random như cron tự động
   */
  async triggerManually(useRandomDelay: boolean = false): Promise<{
    sent: number;
    failed: number;
    employees: any[];
    scheduledTimes?: { employeeCode: string; delayMinutes: number }[];
  }> {
    this.logger.log(
      `🔧 [MANUAL] Manually triggered GPS check (Random delay: ${useRandomDelay})`,
    );

    const employees = await this.findEmployeesInActiveShift();

    let successCount = 0;
    let failCount = 0;
    const scheduledTimes: { employeeCode: string; delayMinutes: number }[] = [];

    for (const emp of employees) {
      try {
        if (useRandomDelay) {
          // 🎲 Random delay như cron tự động
          const randomDelayMs = Math.floor(Math.random() * 60 * 60 * 1000);
          const delayMinutes = Math.floor(randomDelayMs / 60000);

          scheduledTimes.push({
            employeeCode: emp.employee_code,
            delayMinutes,
          });

          this.logger.debug(
            `⏱️  Employee ${emp.employee_code} will receive GPS request in ${delayMinutes} minutes`,
          );

          setTimeout(() => {
            this.requestGpsCheck(emp);
          }, randomDelayMs);
        } else {
          // ⚡ Gửi ngay lập tức cho TEST
          this.requestGpsCheck(emp);
        }

        successCount++;
      } catch {
        failCount++;
      }
    }

    const result: any = {
      sent: successCount,
      failed: failCount,
      employees: employees.map((e) => ({
        employeeId: e.employee_id,
        employeeCode: e.employee_code,
        fullName: e.full_name,
        shiftName: e.shift_name,
      })),
    };

    if (useRandomDelay) {
      result.scheduledTimes = scheduledTimes;
    }

    return result;
  }
}
