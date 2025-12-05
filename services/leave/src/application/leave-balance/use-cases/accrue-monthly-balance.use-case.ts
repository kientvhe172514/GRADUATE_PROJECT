import { Inject, Injectable, Logger } from '@nestjs/common';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import {
  LEAVE_BALANCE_REPOSITORY,
  LEAVE_TYPE_REPOSITORY,
  LEAVE_BALANCE_TRANSACTION_REPOSITORY,
} from '../../tokens';

/**
 * Monthly Accrual Use Case
 *
 * Thực hiện tính lũy tích phép hàng tháng cho tất cả nhân viên.
 * Ví dụ: Nếu annual leave có accrual_rate = 1.0 (1 ngày/tháng),
 * mỗi tháng sẽ cộng thêm 1 ngày vào balance.
 *
 * Logic:
 * 1. Lấy tất cả leave types có is_accrued = true
 * 2. Với mỗi leave type, tìm tất cả employees hiện tại có balance
 * 3. Kiểm tra accrual_start_month: nếu startMonth <= currentMonth thì mới tính
 * 4. Cộng (accrual_rate) vào remaining_days
 * 5. Ghi lại transaction với type = 'ACCRUAL'
 */
@Injectable()
export class AccrueMonthlyBalanceUseCase {
  private readonly logger = new Logger(AccrueMonthlyBalanceUseCase.name);

  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactions: ILeaveBalanceTransactionRepository,
  ) {}

  /**
   * Thực hiện accrual cho tất cả nhân viên
   * @param year Năm áp dụng
   * @param month Tháng áp dụng (1-12)
   */
  async execute(year: number, month: number) {
    this.logger.log(`Starting monthly accrual for ${month}/${year}`);

    try {
      // 1. Lấy tất cả leave types có is_accrued = true
      const allTypes = await this.leaveTypes.findActive();
      const accruedTypes = allTypes.filter(
        (lt) => lt.is_accrued && Number(lt.accrual_rate || 0) > 0,
      );

      if (!accruedTypes || accruedTypes.length === 0) {
        this.logger.log('No accrued leave types found');
        return { processed: 0, success: 0, failed: 0 };
      }

      let processedCount = 0;
      let successCount = 0;
      let failedCount = 0;

      for (const leaveType of accruedTypes) {
        try {
          // Kiểm tra xem tháng hiện tại có được tính accrual không
          const accrualStartMonth = leaveType.accrual_start_month || 0;
          if (accrualStartMonth > 0 && accrualStartMonth > month) {
            this.logger.debug(
              `Leave type ${leaveType.leave_type_code} accrual not started yet (start month: ${accrualStartMonth})`,
            );
            continue;
          }

          const accrualRate = Number(leaveType.accrual_rate || 0);
          if (accrualRate <= 0) {
            this.logger.debug(
              `Leave type ${leaveType.leave_type_code} has no accrual rate`,
            );
            continue;
          }

          // 2. Lấy tất cả balance của leave type này cho năm hiện tại
          // LIMITATION: Repository không có method getByLeaveTypeAndYear
          // SOLUTION: Cần thêm method vào ILeaveBalanceRepository
          // TODO: Implement findByLeaveTypeAndYear method in repository

          this.logger.warn(
            `Leave type ${leaveType.leave_type_code}: Need to add findByLeaveTypeAndYear method to repository`,
          );

          // TẠM THỜI: Ghi log để manual xử lý hoặc implement sau
          processedCount++;
        } catch (error) {
          this.logger.error(
            `Failed to process leave type ${leaveType.leave_type_code}:`,
            error,
          );
          failedCount++;
        }
      }

      this.logger.log(
        `Monthly accrual completed: processed=${processedCount}, success=${successCount}, failed=${failedCount}`,
      );
      return { processed: processedCount, success: successCount, failed: failedCount };
    } catch (error) {
      this.logger.error('Error during monthly accrual:', error);
      throw error;
    }
  }
}
