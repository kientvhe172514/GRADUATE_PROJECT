import { Inject, Injectable, Logger, Inject as InjectClient } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LEAVE_BALANCE_REPOSITORY, LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { lastValueFrom, catchError } from 'rxjs';

/**
 * Create All Employee Balances Use Case
 *
 * Thực hiện tạo leave balance cho tất cả nhân viên khi:
 * 1. Sang năm mới (new year)
 * 2. Một nhân viên mới được thêm vào hệ thống
 * 3. Khi một leave type mới được tạo
 *
 * Quy trình:
 * 1. Lấy danh sách tất cả active employees từ Employee Service (RPC)
 * 2. Lấy tất cả active leave types
 * 3. Với mỗi employee + leave type combination:
 *    - Kiểm tra xem balance đã tồn tại hay chưa
 *    - Nếu chưa, tạo balance với initial days dựa vào leave type
 * 4. Return kết quả (tổng số balance đã tạo)
 */
@Injectable()
export class CreateAllEmployeeBalancesUseCase {
  private readonly logger = new Logger(CreateAllEmployeeBalancesUseCase.name);

  constructor(
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly balances: ILeaveBalanceRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypes: ILeaveTypeRepository,
    @InjectClient('EMPLOYEE_SERVICE')
    private employeeClient: ClientProxy,
  ) {}

  /**
   * Tạo leave balances cho tất cả employees hoặc một employee cụ thể
   * @param year Năm áp dụng
   * @param employeeId Optional: nếu chỉ định, chỉ tạo cho employee này; ngược lại tạo cho tất cả
   */
  async execute(year: number, employeeId?: number) {
    this.logger.log(
      `Starting create balances for year ${year}${employeeId ? ` and employee ${employeeId}` : ' for all employees'}`,
    );

    try {
      // 1. Lấy danh sách employees
      let employees: any[] = [];
      if (employeeId) {
        // Nếu chỉ định employee_id, chỉ tạo cho employee đó
        employees = [{ id: employeeId }];
        this.logger.log(`Creating balance for specific employee: ${employeeId}`);
      } else {
        // Lấy danh sách tất cả active employees từ Employee Service
        employees = await this.getAllActiveEmployees();
        if (!employees || employees.length === 0) {
          this.logger.log('No active employees found');
          return {
            processed: 0,
            created: 0,
            skipped: 0,
            failed: 0,
            message: 'No active employees found',
          };
        }
        this.logger.log(`Found ${employees.length} active employees`);
      }

      // 2. Lấy tất cả active leave types
      const leaveTypes = await this.leaveTypes.findActive();
      if (!leaveTypes || leaveTypes.length === 0) {
        this.logger.log('No active leave types found');
        return {
          processed: 0,
          created: 0,
          skipped: 0,
          failed: 0,
          message: 'No active leave types found',
        };
      }
      this.logger.log(`Found ${leaveTypes.length} active leave types`);

      let processedCount = 0;
      let createdCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      // 3. Tạo balance cho mỗi employee + leave type combination
      for (const employee of employees) {
        for (const leaveType of leaveTypes) {
          try {
            processedCount++;
            const empId = employee.id || employee.employee_id;

            // Kiểm tra xem balance đã tồn tại hay chưa
            const exists = await this.balances.findByEmployeeLeaveTypeAndYear(empId, leaveType.id, year);
            if (exists) {
              this.logger.debug(
                `Balance already exists for employee ${empId}, leave type ${leaveType.leave_type_code}, year ${year}`,
              );
              skippedCount++;
              continue;
            }

            // Tạo balance mới
            // 🎯 ACCRUAL MODE: Nếu leave type có is_accrued = true, khởi tạo = 0
            // Sẽ tính từng tháng qua scheduler (monthly cron job)
            const isAccrued = leaveType.is_accrued && (leaveType.accrual_rate || 0) > 0;
            const initialDays = isAccrued ? 0 : Number(leaveType.max_days_per_year || 0);

            const created = await this.balances.create({
              employee_id: empId,
              leave_type_id: leaveType.id,
              year,
              total_days: initialDays, // 0 nếu accrual, 12 nếu full allocation
              used_days: 0,
              pending_days: 0,
              remaining_days: initialDays, // 0 nếu accrual, 12 nếu full allocation
              carried_over_days: 0,
              adjusted_days: 0,
            });

            this.logger.debug(
              `Created balance for employee ${empId}, leave type ${leaveType.leave_type_code}, year ${year}`,
            );
            createdCount++;
          } catch (error) {
            this.logger.error(
              `Failed to create balance for employee ${employee.id || employee.employee_id}, leave type ${leaveType.leave_type_code}:`,
              error,
            );
            failedCount++;
          }
        }
      }

      const result = {
        processed: processedCount,
        created: createdCount,
        skipped: skippedCount,
        failed: failedCount,
        message: `Processed ${processedCount} combinations, created ${createdCount}, skipped ${skippedCount}, failed ${failedCount}`,
      };

      this.logger.log(
        `Create balances completed: ${result.message}`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error during create balances:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả active employees từ Employee Service qua RPC
   */
  private async getAllActiveEmployees(): Promise<any[]> {
    try {
      this.logger.log('Fetching all active employees from Employee Service');
      
      // Gửi request đến Employee Service qua RPC
      const employees = await lastValueFrom(
        this.employeeClient.send({ cmd: 'get_all_active_employees' }, {}).pipe(
          catchError((error) => {
            this.logger.warn(`Failed to fetch employees from RPC: ${error.message}. Using empty list.`);
            throw error;
          }),
        ),
      );

      return Array.isArray(employees) ? employees : [];
    } catch (error) {
      this.logger.error('Error fetching employees from Employee Service:', error);
      // Nếu không thể lấy từ RPC, trả về mảng rỗng
      // Có thể implement fallback logic ở đây (ví dụ: query database directly)
      return [];
    }
  }
}
