import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
  ResponseStatus,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';

@Injectable()
export class CancelOvertimeRequestUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    id: number,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<void>> {
    const request = await this.overtimeRepo.findOne({ where: { id } });

    if (!request) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Overtime request not found',
        404,
      );
    }

    // Debug log - check sub values
    console.log('[CancelOvertimeRequest] Debug sub check:', {
      request_requested_by: request.requested_by,
      request_requested_by_type: typeof request.requested_by,
      currentUser_sub: currentUser.sub,
      currentUser_sub_type: typeof currentUser.sub,
      sub_strict_equal: request.requested_by === currentUser.sub,
      sub_loose_equal: request.requested_by == currentUser.sub,
    });

    // Actual check uses employee_id
    console.log('[CancelOvertimeRequest] Permission check:', {
      request_employee_id: request.employee_id,
      request_employee_id_type: typeof request.employee_id,
      currentUser_employee_id: currentUser.employee_id,
      currentUser_employee_id_type: typeof currentUser.employee_id,
      strict_equal: request.employee_id === currentUser.employee_id,
      loose_equal: request.employee_id == currentUser.employee_id,
    });

    // Only the employee who owns the overtime request can cancel it
    if (request.employee_id != currentUser.employee_id) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'You can only cancel your own requests.',
        403,
      );
    }

    // Can only cancel PENDING requests
    if (request.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Cannot cancel request that is already approved/rejected.',
        400,
      );
    }

    // Update status to CANCELLED
    const updated = await this.overtimeRepo.updateRequest(id, {
      status: 'CANCELLED',
      updated_at: new Date(),
    });

    if (!updated) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to cancel overtime request',
        500,
      );
    }

    return {
      status: ResponseStatus.SUCCESS,
      statusCode: 200,
      message: 'Overtime request cancelled successfully',
      data: undefined,
      errorCode: 'SUCCESS',
      timestamp: new Date().toISOString(),
      path: '',
    };
  }
}
