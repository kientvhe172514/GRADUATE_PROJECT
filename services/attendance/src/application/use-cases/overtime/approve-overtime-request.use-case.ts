import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class ApproveOvertimeRequestUseCase {
  constructor(
    private readonly overtimeRepo: OvertimeRequestRepository,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

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

    const approved = await this.overtimeRepo.approveRequest(
      id,
      currentUser.sub,
    );

    if (!approved) {
      throw new BusinessException(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Overtime approval failed.',
        500,
      );
    }

    this.notificationClient.emit('overtime.approved', {
      employee_id: request.employee_id,
      overtime_date: request.overtime_date,
      estimated_hours: request.estimated_hours,
    });

    return ApiResponseDto.success(
      undefined,
      'Overtime request approved successfully',
    );
  }
}
