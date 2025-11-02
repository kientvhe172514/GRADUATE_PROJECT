import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { LeaveTypeResponseDto } from '../dto/leave-type-response.dto';
import { LeaveTypeMapper } from '../mappers/leave-type.mapper';

@Injectable()
export class GetLeaveTypesUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(activeOnly: boolean = false): Promise<LeaveTypeResponseDto[]> {
    const entities = activeOnly
      ? await this.leaveTypeRepository.findActive()
      : await this.leaveTypeRepository.findAll();

    return LeaveTypeMapper.toResponseDtoList(entities);
  }
}
