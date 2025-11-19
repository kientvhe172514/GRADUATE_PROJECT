import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';

@Injectable()
export class GetOvertimeRequestByIdUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(id: number): Promise<ApiResponseDto<any>> {
    const request = await this.overtimeRepo.findOne({ where: { id } });

    if (!request) {
      throw new BusinessException(
        ErrorCodes.NOT_FOUND,
        'Overtime request not found',
        404,
      );
    }

    return ApiResponseDto.success(
      request,
      'Overtime request retrieved successfully',
    );
  }
}
