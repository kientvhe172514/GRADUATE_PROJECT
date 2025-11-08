import { Inject, Injectable } from '@nestjs/common';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { ILeaveRecordRepository } from '../../ports/leave-record.repository.interface';
import { LEAVE_RECORD_REPOSITORY } from '../../tokens';
import { LeaveRecordResponseDto } from '../dto/leave-record.dto';

@Injectable()
export class GetLeaveRecordByIdUseCase {
  constructor(
    @Inject(LEAVE_RECORD_REPOSITORY)
    private readonly leaveRecordRepository: ILeaveRecordRepository,
  ) {}

  async execute(id: number): Promise<LeaveRecordResponseDto> {
    const leaveRecord = await this.leaveRecordRepository.findById(id);
    if (!leaveRecord) {
      throw new BusinessException(
        ErrorCodes.LEAVE_RECORD_NOT_FOUND,
        'Leave record not found',
        404,
      );
    }

    return leaveRecord as LeaveRecordResponseDto;
  }
}

