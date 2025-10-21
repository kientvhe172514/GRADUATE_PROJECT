import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from '../../../domain/entities/position.entity';
import { PositionSchema } from '../typeorm/position.schema';
import { PositionMapper } from '../mappers/position.mapper';
import { PositionRepositoryPort } from '../../../application/ports/position.repository.port';

@Injectable()
export class PostgresPositionRepository implements PositionRepositoryPort {
  constructor(
    @InjectRepository(PositionSchema)
    private readonly positionRepository: Repository<PositionSchema>,
  ) {}

  async findAll(page = 1, limit = 10): Promise<{ positions: Position[]; total: number }> {
    const [positions, total] = await this.positionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      positions: positions.map(PositionMapper.toDomain),
      total,
    };
  }

  async findById(id: number): Promise<Position | null> {
    const position = await this.positionRepository.findOne({ where: { id } });
    return position ? PositionMapper.toDomain(position) : null;
  }

  async findByCode(position_code: string): Promise<Position | null> {
    const position = await this.positionRepository.findOne({ where: { position_code } });
    return position ? PositionMapper.toDomain(position) : null;
  }

  async create(position: Position): Promise<Position> {
    const schema = PositionMapper.toSchema(position);
    const savedPosition = await this.positionRepository.save(schema);
    return PositionMapper.toDomain(savedPosition);
  }

  async update(id: number, position: Partial<Position>): Promise<Position> {
    await this.positionRepository.update(id, position);
    const updatedPosition = await this.positionRepository.findOne({ where: { id } });
    if (!updatedPosition) {
      throw new Error('Position not found');
    }
    return PositionMapper.toDomain(updatedPosition);
  }

  async delete(id: number): Promise<void> {
    const result = await this.positionRepository.delete(id);
    if (result.affected === 0) {
      throw new Error('Position not found');
    }
  }
}
