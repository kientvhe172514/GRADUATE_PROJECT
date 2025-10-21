import { Injectable, Inject } from '@nestjs/common';
import { PositionRepositoryPort } from '../ports/position.repository.port';
import { Position } from '../../domain/entities/position.entity';
import { CreatePositionDto } from '../dto/create-position.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodes } from '../../common/enums/error-codes.enum';
import { POSITION_REPOSITORY } from '../tokens';

@Injectable()
export class CreatePositionUseCase {
  constructor(@Inject(POSITION_REPOSITORY) private readonly positionRepository: PositionRepositoryPort) {}

  async execute(createPositionDto: CreatePositionDto): Promise<Position> {
    // Check if position code already exists
    const existingPosition = await this.positionRepository.findByCode(createPositionDto.position_code);
    
    if (existingPosition) {
      throw new BusinessException(
        ErrorCodes.POSITION_CODE_ALREADY_EXISTS,
        `Position with code ${createPositionDto.position_code} already exists`,
        400,
      );
    }

    const position = new Position();
    position.position_code = createPositionDto.position_code;
    position.position_name = createPositionDto.position_name;
    position.description = createPositionDto.description;
    position.level = createPositionDto.level;
    position.department_id = createPositionDto.department_id;
    position.suggested_role = createPositionDto.suggested_role;
    position.salary_min = createPositionDto.salary_min;
    position.salary_max = createPositionDto.salary_max;
    position.currency = createPositionDto.currency || 'VND';
    position.status = 'ACTIVE';

    return this.positionRepository.create(position);
  }
}
