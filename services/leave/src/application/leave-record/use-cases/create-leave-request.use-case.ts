import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { ILeaveBalanceRepository } from '../../ports/leave-balance.repository.interface';
import { ILeaveBalanceTransactionRepository } from '../../ports/leave-balance-transaction.repository.interface';
import { EventPublisherPort } from '../../ports/event.publisher.port';
import {
  LEAVE_RECORD_REPOSITORY,
  LEAVE_TYPE_REPOSITORY,
  LEAVE_BALANCE_REPOSITORY,
  LEAVE_BALANCE_TRANSACTION_REPOSITORY,
  EVENT_PUBLISHER,
} from '../../tokens';
import {
  CreateLeaveRequestDto,
  LeaveRecordResponseDto,
} from '../dto/leave-record.dto';
import { LeaveRecordEntity } from '../../../domain/entities/leave-record.entity';

@Injectable()
export class CreateLeaveRequestUseCase {
  private _transactionData?: {
    employee_id: number;
    leave_type_id: number;
    year: number;
    currentBalance: number;
    requestedDays: number;
    reason?: string;
  };

  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
    @Inject(LEAVE_BALANCE_REPOSITORY)
    private readonly leaveBalanceRepository: ILeaveBalanceRepository,
    @Inject(LEAVE_BALANCE_TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ILeaveBalanceTransactionRepository,
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: EventPublisherPort,
    @Inject('EMPLOYEE_SERVICE')
    private readonly employeeService: ClientProxy,
  ) {}

  async execute(
    dto: CreateLeaveRequestDto,
    employeeId: number,
  ): Promise<LeaveRecordResponseDto> {
    // ✅ employeeId extracted from JWT token in controller

    // 1. Fetch employee information to get employee_code and department_id
    let employeeInfo: any;
    try {
      employeeInfo = await firstValueFrom(
        this.employeeService.send(
          { cmd: 'get_employee_by_id' },
          { id: employeeId },
        ),
      );
    } catch (error) {
      throw new BusinessException(
        ErrorCodes.EMPLOYEE_NOT_FOUND,
        'Employee information not found. Please ensure your employee profile exists.',
        404,
      );
    }

    if (!employeeInfo || !employeeInfo.employee_code) {
      throw new BusinessException(
        ErrorCodes.EMPLOYEE_NOT_FOUND,
        'Employee information incomplete. Missing employee code.',
        404,
      );
    }

    // 2. Validate leave type exists
    const leaveType = await this.leaveTypeRepository.findById(
      dto.leave_type_id,
    );
    if (!leaveType) {
      throw new BusinessException(
        ErrorCodes.LEAVE_TYPE_NOT_FOUND,
        'Leave type not found',
        404,
      );
    }

    // 2. Validate date range
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (startDate > endDate) {
      throw new BusinessException(
        ErrorCodes.INVALID_LEAVE_DATE_RANGE,
        'Start date must be before or equal to end date',
        400,
      );
    }

    // 3. Check for overlapping leave requests
    const overlappingLeaves = await this.leaveRecordRepository.findByDateRange(
      startDate,
      endDate,
    );
    const hasOverlap = overlappingLeaves.some(
      (leave) =>
        leave.employee_id === employeeId &&
        (leave.status === 'PENDING' || leave.status === 'APPROVED'),
    );

    if (hasOverlap) {
      throw new BusinessException(
        ErrorCodes.LEAVE_REQUEST_OVERLAPS,
        'You already have a pending or approved leave request during this period',
        400,
      );
    }

    // 4. Calculate leave days
    const totalCalendarDays = this.calculateCalendarDays(startDate, endDate);
    const totalWorkingDays = this.calculateWorkingDays(
      startDate,
      endDate,
      dto.is_half_day_start,
      dto.is_half_day_end,
    );
    const totalLeaveDays = totalWorkingDays; // Can be adjusted based on leave type rules

    // 5. Check leave balance exists (but don't deduct yet - will deduct on approval)
    if (leaveType.deducts_from_balance) {
      const year = startDate.getFullYear();
      const balance =
        await this.leaveBalanceRepository.findByEmployeeLeaveTypeAndYear(
          employeeId,
          dto.leave_type_id,
          year,
        );

      if (!balance) {
        throw new BusinessException(
          ErrorCodes.LEAVE_BALANCE_NOT_FOUND,
          'Leave balance not found. Please contact HR to initialize your leave balance.',
          404,
        );
      }

      // NEW LOGIC: Just check balance exists, allow request even if balance = 0
      // Balance will be deducted when the request is APPROVED, not when created
      const remainingDays = Number(balance.remaining_days);

      // Store info for transaction log (for audit trail only)
      this._transactionData = {
        employee_id: employeeId,
        leave_type_id: dto.leave_type_id,
        year: year,
        currentBalance: remainingDays,
        requestedDays: totalLeaveDays,
        reason: dto.reason,
      };
    }

    // 6. Create leave record with employee information
    const leaveRecord = new LeaveRecordEntity({
      ...dto,
      employee_id: employeeId,
      employee_code: employeeInfo.employee_code,
      department_id: employeeInfo.department_id || null,
      start_date: startDate,
      end_date: endDate,
      total_calendar_days: totalCalendarDays,
      total_working_days: totalWorkingDays,
      total_leave_days: totalLeaveDays,
      status: 'PENDING',
      requested_at: new Date(),
      approval_level: 1,
      current_approver_id: undefined, // TODO: Set based on approval workflow
    });

    const created = await this.leaveRecordRepository.create(leaveRecord);

    // Record transaction for audit trail (no balance deduction yet)
    if (this._transactionData) {
      const txData = this._transactionData;
      await this.transactionRepository.create({
        employee_id: txData.employee_id,
        leave_type_id: txData.leave_type_id,
        year: txData.year,
        transaction_type: 'LEAVE_REQUESTED',
        amount: 0, // No deduction at request time
        balance_before: txData.currentBalance,
        balance_after: txData.currentBalance, // Balance unchanged
        reference_type: 'LEAVE_RECORD',
        reference_id: created.id,
        description: `Leave request created (pending approval): Requested ${txData.requestedDays} days, current balance: ${txData.currentBalance} days - ${txData.reason || 'No reason provided'}`,
        created_by: txData.employee_id,
      });
      delete this._transactionData;
    }

    // 7. Publish event to notify managers (HR_MANAGER or DEPARTMENT_MANAGER)
    this.eventPublisher.publish('leave.requested', {
      leaveId: created.id,
      employeeId: created.employee_id,
      employeeCode: created.employee_code,
      departmentId: created.department_id,
      leaveTypeId: leaveType.id,
      leaveType: leaveType.leave_type_name,
      leaveTypeCode: leaveType.leave_type_code,
      startDate: created.start_date.toISOString().split('T')[0],
      endDate: created.end_date.toISOString().split('T')[0],
      totalLeaveDays: created.total_leave_days,
      reason: created.reason,
      status: created.status,
      requestedAt: created.requested_at.toISOString(),
      // Additional info for notification service to find managers
      recipientType: 'MANAGER', // Notify HR_MANAGER or DEPARTMENT_MANAGER
    });

    return created as LeaveRecordResponseDto;
  }

  private calculateCalendarDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  private calculateWorkingDays(
    startDate: Date,
    endDate: Date,
    isHalfDayStart: boolean,
    isHalfDayEnd: boolean,
  ): number {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Adjust for half days
    if (isHalfDayStart) workingDays -= 0.5;
    if (isHalfDayEnd) workingDays -= 0.5;

    return workingDays;
  }
}
