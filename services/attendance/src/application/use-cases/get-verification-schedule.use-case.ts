import { Inject, Injectable } from '@nestjs/common';
import { IEmployeeShiftRepository } from '../ports/employee-shift.repository.port';
import { PresenceVerificationRepositoryPort } from '../ports/presence-verification.repository.port';
import { VerificationScheduleDto } from '../presence-verification/dto/presence-verification.dto';

/**
 * Use Case: Get Verification Schedule
 * 
 * Business Logic:
 * 1. Find employee's active shift for today
 * 2. Calculate 3 verification rounds (25%, 50%, 75% of shift duration)
 * 3. Check which rounds are already completed
 * 4. Return schedule with status for each round
 * 
 * Returns schedule even if no active shift (empty schedule)
 */
@Injectable()
export class GetVerificationScheduleUseCase {
  constructor(
    @Inject('IEmployeeShiftRepository')
    private readonly employeeShiftRepository: IEmployeeShiftRepository,
    @Inject('IPresenceVerificationRepository')
    private readonly presenceVerificationRepository: PresenceVerificationRepositoryPort,
  ) {}

  async execute(employeeId: number): Promise<VerificationScheduleDto> {
    // 1. Find active shift for employee today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeShift = await this.employeeShiftRepository.findByEmployeeIdAndDate(
      employeeId,
      today,
    );

    // If no active shift, return empty schedule
    if (!activeShift || activeShift.status !== 'IN_PROGRESS') {
      return {
        has_active_shift: false,
        shift_id: undefined,
        schedule: [],
        current_round: 0,
        total_rounds: 3,
      };
    }

    // 2. Calculate verification schedule (25%, 50%, 75% of shift duration)
    const rounds = this.calculateVerificationRounds(
      activeShift.actual_check_in,
      this.calculateExpectedCheckout(activeShift),
    );

    // 3. Get completed verifications for this shift
    if (!activeShift.id) {
      throw new Error('Active shift missing ID');
    }
    const completedVerifications = await this.presenceVerificationRepository.findByShiftId(
      activeShift.id,
    );

    // 4. Map rounds with completion status
    const roundsWithStatus = rounds.map((round, index) => {
      const roundNumber = index + 1;
      const completed = completedVerifications.find(
        (v) => v.round_number === roundNumber,
      );

      return {
        round_number: roundNumber,
        scheduled_time: round,
        is_completed: !!completed,
        completed_at: completed?.captured_at || null,
        is_valid: completed?.is_valid || null,
        is_overdue: this.isOverdue(round),
      };
    });

    return {
      has_active_shift: true,
      shift_id: activeShift.id,
      schedule: roundsWithStatus,
      current_round: completedVerifications.length + 1,
      total_rounds: 3,
    };
  }

  /**
   * Calculate 3 verification rounds at 25%, 50%, 75% of shift duration
   */
  private calculateVerificationRounds(
    checkinTime: Date | undefined,
    expectedCheckoutTime: Date,
  ): Date[] {
    if (!checkinTime) return [];
    

    const shiftDurationMs =
      expectedCheckoutTime.getTime() - checkinTime.getTime();

    const round1Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.25,
    );
    const round2Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.5,
    );
    const round3Time = new Date(
      checkinTime.getTime() + shiftDurationMs * 0.75,
    );

    return [round1Time, round2Time, round3Time];
  }

  /**
   * Check if scheduled time has passed by more than 30 minutes
   */
  private isOverdue(scheduledTime: Date): boolean {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    return scheduledTime < thirtyMinutesAgo;
  }

  /**
   * Calculate expected checkout time from shift
   */
  private calculateExpectedCheckout(shift: any): Date {
    if (!shift.shift_date || !shift.end_time) {
      return new Date();
    }
    const dateStr = shift.shift_date.toISOString().split('T')[0];
    return new Date(`${dateStr}T${shift.end_time}`);
  }
}
