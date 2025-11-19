import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { RejectOvertimeDto } from '../../dtos/overtime-request.dto';

@Injectable()
export class RejectOvertimeRequestUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    id: number,
    dto: RejectOvertimeDto,
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

    const rejected = await this.overtimeRepo.rejectRequest(
      id,
      currentUser.sub,
      dto.rejection_reason || 'No reason provided',
    );

    if (!rejected) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Overtime rejection failed.',
        500,
      );
    }

    return ApiResponseDto.success(
      undefined,
      'Overtime request rejected successfully',
    );
  }
}
