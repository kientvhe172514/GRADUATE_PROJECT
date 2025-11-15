import { Position } from '../../domain/entities/position.entity';

export interface PositionRepositoryPort {
  findAll(page?: number, limit?: number): Promise<{ positions: Position[]; total: number }>;
  findWithPagination(criteria: any): Promise<{ positions: Position[]; total: number }>;
  findById(id: number): Promise<Position | null>;
  findByCode(position_code: string): Promise<Position | null>;
  create(position: Position): Promise<Position>;
  update(id: number, position: Partial<Position>): Promise<Position>;
  delete(id: number): Promise<void>;
}
