import { Injectable } from '@nestjs/common';
import { ApiResponseDto } from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { OvertimeQueryDto } from '../../dtos/overtime-request.dto';

@Injectable()
export class ListOvertimeRequestsUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    query: OvertimeQueryDto,
  ): Promise<ApiResponseDto<{ data: any[]; total: number }>> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const requests = query.status
      ? await this.overtimeRepo.findByStatus(query.status, limit, offset)
      : await this.overtimeRepo.find({
          take: limit,
          skip: offset,
          order: { created_at: 'DESC' },
        });

    return ApiResponseDto.success(
      {
        data: requests,
        total: requests.length,
      },
      'Overtime requests retrieved successfully',
    );
  }
}
