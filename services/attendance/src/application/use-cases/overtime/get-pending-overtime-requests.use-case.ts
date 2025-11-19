import { Injectable } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';

@Injectable()
export class GetPendingOvertimeRequestsUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    limit = 50,
    offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const requests = await this.overtimeRepo.findPendingRequests(limit, offset);

    return ApiResponseDto.success(
      { data: requests, total: requests.length },
      'Pending overtime requests retrieved successfully',
    );
  }
}
