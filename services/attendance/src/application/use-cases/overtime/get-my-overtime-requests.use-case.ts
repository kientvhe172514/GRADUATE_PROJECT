import { Injectable } from '@nestjs/common';
import { ApiResponseDto, JwtPayload } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';

@Injectable()
export class GetMyOvertimeRequestsUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    currentUser: JwtPayload,
    limit = 20,
    offset = 0,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const requests = await this.overtimeRepo.findByEmployeeId(
      currentUser.employee_id!,
      limit,
      offset,
    );

    return ApiResponseDto.success(
      {
        data: requests,
        total: requests.length,
      },
      'Your overtime requests retrieved successfully',
    );
  }
}
