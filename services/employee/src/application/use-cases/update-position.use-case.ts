import { Injectable, Inject } from '@nestjs/common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { Position } from '../../domain/entities/position.entity';
import { UpdatePositionDto } from '../dto/update-position.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { POSITION_REPOSITORY } from '../tokens';

@Injectable()
export class UpdatePositionUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(id: number, updatePositionDto: UpdatePositionDto): Promise<Position> {
    // Check if position exists
    const existingPosition = await this.positionRepository.findById(id);
    
    if (!existingPosition) {
      throw new BusinessException(
        ErrorCodes.POSITION_NOT_FOUND,
        `Position with id ${id} not found`,
        404,
      );
    }

    // Check if position code already exists (if being updated)
    if (updatePositionDto.position_code && updatePositionDto.position_code !== existingPosition.position_code) {
      const positionWithSameCode = await this.positionRepository.findByCode(updatePositionDto.position_code);
      
      if (positionWithSameCode) {
        throw new BusinessException(
          ErrorCodes.POSITION_CODE_ALREADY_EXISTS,
          `Position with code ${updatePositionDto.position_code} already exists`,
          400,
        );
      }
    }

    const updateData: Partial<Position> = {};
    
    if (updatePositionDto.position_code !== undefined) {
      updateData.position_code = updatePositionDto.position_code;
    }
    if (updatePositionDto.position_name !== undefined) {
      updateData.position_name = updatePositionDto.position_name;
    }
    if (updatePositionDto.description !== undefined) {
      updateData.description = updatePositionDto.description;
    }
    if (updatePositionDto.level !== undefined) {
      updateData.level = updatePositionDto.level;
    }
    if (updatePositionDto.department_id !== undefined) {
      updateData.department_id = updatePositionDto.department_id;
    }
    if (updatePositionDto.suggested_role !== undefined) {
      updateData.suggested_role = updatePositionDto.suggested_role;
    }
    if (updatePositionDto.salary_min !== undefined) {
      updateData.salary_min = updatePositionDto.salary_min;
    }
    if (updatePositionDto.salary_max !== undefined) {
      updateData.salary_max = updatePositionDto.salary_max;
    }
    if (updatePositionDto.currency !== undefined) {
      updateData.currency = updatePositionDto.currency;
    }
    if (updatePositionDto.status !== undefined) {
      updateData.status = updatePositionDto.status;
    }

    return this.positionRepository.update(id, updateData);
  }
}
