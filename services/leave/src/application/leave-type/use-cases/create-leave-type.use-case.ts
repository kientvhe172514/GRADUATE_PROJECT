import { Inject, Injectable } from '@nestjs/common';
import { LEAVE_TYPE_REPOSITORY } from '../../tokens';
import { ILeaveTypeRepository } from '../../ports/leave-type.repository.interface';
import { CreateLeaveTypeDto } from '../dto/leave-type.dto';

@Injectable()
export class CreateLeaveTypeUseCase {
  constructor(
    @Inject(LEAVE_TYPE_REPOSITORY)
    private readonly leaveTypeRepository: ILeaveTypeRepository,
  ) {}

  async execute(dto: CreateLeaveTypeDto) {
    // Check if code already exists
    const existing = await this.leaveTypeRepository.findByCode(dto.leave_type_code);
    if (existing) {
      throw new Error('Leave type code already exists');
    }

    return this.leaveTypeRepository.create(dto);
  }
}
