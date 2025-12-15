import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { UpdateOvertimeRequestDto } from '../../dtos/overtime-request.dto';

/**
 * Convert date string to Vietnam timezone (UTC+7)
 * If the string has no timezone info, assume it's Vietnam time
 */
function toVietnamTime(dateStr: string): Date {
  // If already has timezone (+07:00, Z, etc.), parse normally
  if (dateStr.includes('+') || dateStr.includes('Z')) {
    return new Date(dateStr);
  }
  // No timezone -> assume Vietnam time (UTC+7)
  // Add +07:00 to the string before parsing
  return new Date(dateStr + '+07:00');
}

@Injectable()
export class UpdateOvertimeRequestUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    id: number,
    dto: UpdateOvertimeRequestDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    const request = await this.overtimeRepo.findOne({ where: { id } });

    if (!request) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Overtime request not found',
        404,
      );
    }

    // Debug log - check sub values
    console.log('[UpdateOvertimeRequest] Debug sub check:', {
      request_requested_by: request.requested_by,
      request_requested_by_type: typeof request.requested_by,
      currentUser_sub: currentUser.sub,
      currentUser_sub_type: typeof currentUser.sub,
      sub_strict_equal: request.requested_by === currentUser.sub,
      sub_loose_equal: request.requested_by == currentUser.sub,
    });

    // Actual check uses employee_id
    console.log('[UpdateOvertimeRequest] Permission check:', {
      request_employee_id: request.employee_id,
      request_employee_id_type: typeof request.employee_id,
      currentUser_employee_id: currentUser.employee_id,
      currentUser_employee_id_type: typeof currentUser.employee_id,
      strict_equal: request.employee_id === currentUser.employee_id,
      loose_equal: request.employee_id == currentUser.employee_id,
    });

    if (request.employee_id != currentUser.employee_id) {
      throw new BusinessException(
        ErrorCodes.PERMISSION_DENIED,
        'You can only update your own requests.',
        403,
      );
    }

    if (request.status !== 'PENDING') {
      throw new BusinessException(
        ErrorCodes.INVALID_STATE_TRANSITION,
        'Cannot update request that is already approved/rejected.',
        400,
      );
    }

    // Convert date strings to Vietnam timezone
    // If frontend sends string without timezone, we assume it's VN time (UTC+7)
    const updateData: any = {};
    
    if (dto.start_time) {
      updateData.start_time = toVietnamTime(dto.start_time);
    }
    if (dto.end_time) {
      updateData.end_time = toVietnamTime(dto.end_time);
    }
    if (dto.estimated_hours !== undefined) {
      updateData.estimated_hours = dto.estimated_hours;
    }
    if (dto.reason) {
      updateData.reason = dto.reason;
    }

    const updated = await this.overtimeRepo.updateRequest(id, updateData);

    if (!updated) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update overtime request.',
        500,
      );
    }

    return ApiResponseDto.success(
      updated,
      'Overtime request updated successfully',
    );
  }
}
