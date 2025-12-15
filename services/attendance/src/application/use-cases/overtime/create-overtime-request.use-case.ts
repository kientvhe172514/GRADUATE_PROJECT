import { Injectable } from '@nestjs/common';
import {
  ApiResponseDto,
  BusinessException,
  ErrorCodes,
  JwtPayload,
} from '@graduate-project/shared-common';
import { OvertimeRequestRepository } from '../../../infrastructure/repositories/overtime-request.repository';
import { CreateOvertimeRequestDto } from '../../dtos/overtime-request.dto';

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
export class CreateOvertimeRequestUseCase {
  constructor(private readonly overtimeRepo: OvertimeRequestRepository) {}

  async execute(
    dto: CreateOvertimeRequestDto,
    currentUser: JwtPayload,
  ): Promise<ApiResponseDto<any>> {
    // Optional: prevent too many pending OT requests for same date
    const pendingCount = await this.overtimeRepo.countPendingByEmployee(
      currentUser.employee_id!,
    );
    if (pendingCount > 20) {
      throw new BusinessException(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many pending overtime requests.',
        429,
      );
    }

    // Convert date strings to Vietnam timezone
    // If frontend sends string without timezone, we assume it's VN time (UTC+7)
    const request = await this.overtimeRepo.createRequest({
      employee_id: currentUser.employee_id!,
      overtime_date: toVietnamTime(dto.overtime_date),
      start_time: toVietnamTime(dto.start_time),
      end_time: toVietnamTime(dto.end_time),
      estimated_hours: dto.estimated_hours,
      reason: dto.reason,
      requested_by: currentUser.sub,
    });

    return ApiResponseDto.success(
      request,
      'Overtime request submitted successfully',
      201,
    );
  }
}
