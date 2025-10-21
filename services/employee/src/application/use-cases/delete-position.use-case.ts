import { Injectable, Inject } from '@nestjs/common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { POSITION_REPOSITORY } from '../tokens';

@Injectable()
export class DeletePositionUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(id: number): Promise<void> {
    // Check if position exists
    const existingPosition = await this.positionRepository.findById(id);
    
    if (!existingPosition) {
      throw new BusinessException(
        ErrorCodes.POSITION_NOT_FOUND,
        `Position with id ${id} not found`,
        404,
      );
    }

    await this.positionRepository.delete(id);
  }
}
