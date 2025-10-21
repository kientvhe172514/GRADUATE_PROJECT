import { Injectable, Inject } from '@nestjs/common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { Position } from '../../domain/entities/position.entity';
import { BusinessException, ErrorCodes } from '@graduate-project/shared-common';
import { POSITION_REPOSITORY } from '../tokens';

@Injectable()
export class GetPositionByIdUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(id: number): Promise<Position> {
    const position = await this.positionRepository.findById(id);
    
    if (!position) {
      throw new BusinessException(
        ErrorCodes.POSITION_NOT_FOUND,
        'Position not found',
        404,
        `Position with id ${id} not found`,
      );
    }

    return position;
  }
}
