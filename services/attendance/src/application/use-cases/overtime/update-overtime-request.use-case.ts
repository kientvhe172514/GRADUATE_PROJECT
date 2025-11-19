import { Injectable } from '@nestjs/common';
import { ApiResponseDto, BusinessException, ErrorCodes, JwtPayload } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { UpdateOvertimeRequestDto } from '../../dtos/overtime-request.dto';

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

    const updateData = {
      ...dto,
      start_time: dto.start_time ? new Date(dto.start_time) : undefined,
      end_time: dto.end_time ? new Date(dto.end_time) : undefined,
    };

    const updated = await this.overtimeRepo.updateRequest(id, updateData as any);

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


