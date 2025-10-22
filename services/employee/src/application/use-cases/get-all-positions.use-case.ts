import { Injectable, Inject } from '@nestjs/common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { Position } from '../../domain/entities/position.entity';
import { POSITION_REPOSITORY } from '../tokens';

@Injectable()
export class GetAllPositionsUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(page = 1, limit = 10): Promise<{ positions: Position[]; total: number }> {
    return this.positionRepository.findAll(page, limit);
  }
}
