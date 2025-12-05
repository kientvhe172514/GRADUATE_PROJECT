import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ILeaveBalanceRepository } from '../../application/ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../application/ports/leave-type.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../application/ports/leave-balance-transaction.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY, LEAVE_BALANCE_TRANSACTION_REPOSITORY } from '../../application/tokens';

@Injectable()
export class LeaveAccrualScheduler {
  private readonly logger = new Logger(LeaveAccrualScheduler.name);

  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactions: ILeaveBalanceTransactionRepository,
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeClient: ClientProxy,
  ) {}

  /**
   * CRON JOB: Chạy hàng tháng để cộng phép lũy tích (2:00 AM, ngày 1 mỗi tháng)
   *
   * BUSINESS LOGIC:
   * 1. Lấy leave types có is_accrued = true
   * 2. Với mỗi leave type:
   *    - Lấy tất cả balances từ DB
   *    - Lấy employee IDs từ balances
   *    - Call RPC sang Employee Service lấy employee details
   *    - Filter những employees có status = 'ACTIVE'
   *    - Cộng accrual_rate vào remaining_days
   *    - Log transaction
   * 3. Gửi log result
   */
  @Cron('0 2 1 * *', {
    name: 'LeaveAccrualMonthly',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleMonthlyAccrual() {
    this.logger.log('=== LEAVE MONTHLY ACCRUAL JOB STARTED ===');
    const startTime = Date.now();

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      this.logger.log(`Running monthly accrual for ${currentMonth}/${currentYear}`);

      // 1️⃣ Tìm leave types có accrual
      const allTypes = await this.leaveTypes.findActive();
      const accruedTypes = allTypes.filter(
        (lt) => lt.is_accrued && (lt.accrual_rate || 0) > 0,
      );

      this.logger.log(`Found ${accruedTypes.length} leave types for accrual`);

      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      // 2️⃣ Với mỗi leave type có accrual
      for (const leaveType of accruedTypes) {
        try {
          const accrualStartMonth = leaveType.accrual_start_month || 1;

          // Kiểm tra accrual có started chưa
          if (currentMonth < accrualStartMonth) {
            this.logger.log(
              `Skipping ${leaveType.leave_type_name}: accrual starts from month ${accrualStartMonth}`,
            );
            continue;
          }

          this.logger.log(`Processing accrual for ${leaveType.leave_type_name} (rate: ${leaveType.accrual_rate})`);

          // 3️⃣ Lấy tất cả balances cho leave type này + year này từ DB
          const balances = await this.balances.findByEmployeeAndYear(null, currentYear);
          const filteredBalances = balances.filter(b => b.leave_type_id === leaveType.id);

          if (filteredBalances.length === 0) {
            this.logger.log(`No balances found for ${leaveType.leave_type_name}`);
            continue;
          }

          this.logger.log(`Found ${filteredBalances.length} balances for ${leaveType.leave_type_name}`);

          // 4️⃣ Lấy unique employee IDs
          const employeeIds = [...new Set(filteredBalances.map(b => b.employee_id))];
          this.logger.log(`Employee IDs to check: ${employeeIds.join(', ')}`);

          // 5️⃣ Call RPC sang Employee Service để lấy employee details
          let activeEmployees: Array<{ id: number; status: string }> = [];
          try {
            const employeesResponse = await firstValueFrom(
              this.employeeClient.send({ cmd: 'get_employees_by_ids' }, { ids: employeeIds }).pipe(
                timeout(5000), // 5 giây timeout
              ),
            );

            this.logger.log(`Received response from Employee Service:`, employeesResponse);

            if (employeesResponse?.data && Array.isArray(employeesResponse.data)) {
              // 6️⃣ Filter employees có status = ACTIVE
              activeEmployees = employeesResponse.data.filter(
                (emp: any) => emp && emp.status === 'ACTIVE',
              );

              this.logger.log(
                `Filtered ${activeEmployees.length} active employees out of ${employeesResponse.data.length}`,
              );
            } else {
              this.logger.warn('Invalid response from Employee Service, using all employees');
              activeEmployees = employeeIds.map(id => ({ id, status: 'ACTIVE' }));
            }
          } catch (rpcError) {
            this.logger.error('Error calling Employee Service RPC:', rpcError);
            // Fallback: Nếu RPC fail, dùng tất cả employees (safe assumption)
            this.logger.warn('Fallback: Using all employees from balances');
            activeEmployees = employeeIds.map(id => ({ id, status: 'ACTIVE' }));
          }

          const activeEmployeeIds = new Set(activeEmployees.map(e => e.id));

          // 7️⃣ Cộng accrual cho mỗi active employee
          for (const balance of filteredBalances) {
            try {
              // Kiểm tra employee có active không
              if (!activeEmployeeIds.has(balance.employee_id)) {
                this.logger.debug(`Skipping employee ${balance.employee_id}: not active`);
                continue;
              }

              const accrualAmount = leaveType.accrual_rate || 0;
              const newRemainingDays = balance.remaining_days + accrualAmount;
              const newTotalDays = balance.total_days + accrualAmount;

              // Update balance
              await this.balances.update(balance.id, {
                remaining_days: newRemainingDays,
                total_days: newTotalDays,
              });

              // Log transaction
              await this.transactions.create({
                employee_id: balance.employee_id,
                leave_type_id: balance.leave_type_id,
                year: currentYear,
                transaction_type: 'ACCRUAL',
                amount: accrualAmount,
                balance_before: balance.remaining_days,
                balance_after: newRemainingDays,
                description: `Monthly accrual for ${leaveType.leave_type_name} (${currentMonth}/${currentYear})`,
                created_by: undefined, // System action
                created_at: new Date(),
              });

              totalUpdated++;
              this.logger.debug(
                `✅ Employee ${balance.employee_id}: +${accrualAmount} days (${newRemainingDays} remaining)`,
              );
            } catch (balanceError) {
              totalErrors++;
              this.logger.error(
                `Error updating balance for employee ${balance.employee_id}:`,
                balanceError,
              );
            }
          }

          totalProcessed += filteredBalances.length;
        } catch (typeError) {
          totalErrors++;
          this.logger.error(`Error processing leave type ${leaveType.leave_type_name}:`, typeError);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(
        `=== LEAVE MONTHLY ACCRUAL COMPLETED ===\nProcessed: ${totalProcessed} | Updated: ${totalUpdated} | Errors: ${totalErrors} | Duration: ${duration}s`,
      );
    } catch (error) {
      this.logger.error('Fatal error in monthly accrual job:', error);
    }
  }

  /**
   * CRON JOB: Chạy hàng năm để carry-over phép (3:00 AM, ngày 1/1)
   */
  @Cron('0 3 1 1 *', {
    name: 'LeaveCarryOverAnnual',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleAnnualCarryOver() {
    this.logger.log('=== LEAVE ANNUAL CARRY-OVER JOB STARTED ===');
    const startTime = Date.now();

    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const previousYear = currentYear - 1;

      this.logger.log(`Running annual carry-over for ${previousYear} → ${currentYear}`);

      // TODO: Implement carry-over logic
      // 1. Find leave types with allow_carry_over = true
      // 2. Get all balances from previousYear
      // 3. For each balance: carried = MIN(remaining, max_carry_over_days)
      // 4. Create new balance for currentYear with carried_over_days
      // 5. Log transactions

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`=== LEAVE ANNUAL CARRY-OVER COMPLETED === Duration: ${duration}s`);
    } catch (error) {
      this.logger.error('Error in annual carry-over job:', error);
    }
  }

  /**
   * CRON JOB: Chạy hàng năm để hết hạn phép carry-over (4:00 AM, ngày 1/4)
   */
  @Cron('0 4 1 4 *', {
    name: 'LeaveCarryOverExpiry',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleCarryOverExpiry() {
    this.logger.log('=== LEAVE CARRY-OVER EXPIRY CLEANUP JOB STARTED ===');
    const startTime = Date.now();

    try {
      const now = new Date();
      const currentYear = now.getFullYear();

      this.logger.log(`Running carry-over expiry cleanup for ${currentYear}`);

      // TODO: Implement expiry cleanup logic
      // 1. Find leave types with allow_carry_over = true
      // 2. Check expiry_date = Jan 1 + carry_over_expiry_months
      // 3. If today >= expiry_date: reset carried_over_days = 0
      // 4. Log transactions

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`=== LEAVE CARRY-OVER EXPIRY CLEANUP COMPLETED === Duration: ${duration}s`);
    } catch (error) {
      this.logger.error('Error in carry-over expiry cleanup job:', error);
    }
  }
}
