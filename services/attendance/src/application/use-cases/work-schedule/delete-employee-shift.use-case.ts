import { Injectable, Logger } from '@nestjs/common';
import {
  BusinessException,
  ApiResponseDto,
} from '@graduate-project/shared-common';
import { EmployeeShiftRepository } from '../../../infrastructure/repositories/employee-shift.repository';

@Injectable()
export class DeleteEmployeeShiftUseCase {
  private readonly logger = new Logger(DeleteEmployeeShiftUseCase.name);

  constructor(
    private readonly employeeShiftRepository: EmployeeShiftRepository,
  ) {}

  async execute(shiftId: number): Promise<ApiResponseDto<void>> {
    this.logger.log(`🗑️ Attempting to delete shift ID: ${shiftId}`);

    // Find shift
    const shift = await this.employeeShiftRepository.findById(shiftId);
    if (!shift) {
      throw new BusinessException(
        'SHIFT_NOT_FOUND',
        'Employee shift not found.',
        404,
      );
    }

    // Check if shift has been started (check-in exists)
    if (shift.check_in_time) {
      throw new BusinessException(
        'SHIFT_ALREADY_STARTED',
        'Cannot delete a shift that has already been started. Please contact HR to modify completed shifts.',
        400,
      );
    }

    this.logger.log(
      `📋 Deleting shift: Employee ${shift.employee_id}, Date ${shift.shift_date.toISOString().split('T')[0]}`,
    );

    // Delete shift
    const deleted = await this.employeeShiftRepository.delete(shiftId);
    if (!deleted) {
      throw new BusinessException(
        'DELETE_FAILED',
        'Failed to delete shift.',
        500,
      );
    }

    this.logger.log(`✅ Successfully deleted shift ID ${shiftId}`);

    return ApiResponseDto.success(
      undefined,
      'Shift deleted successfully. Employee will not be scheduled for this date.',
    );
  }
}
