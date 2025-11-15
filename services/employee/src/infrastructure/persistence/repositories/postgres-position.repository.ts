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

  async findWithPagination(criteria: any): Promise<{ positions: Position[]; total: number }> {
    let whereConditions: string[] = [];
    const whereParams: any[] = [];
    let paramIndex = 1;

    // Filter by status - check for truthy value and non-empty string
    if (criteria.status !== undefined && criteria.status !== null && criteria.status !== '') {
      whereConditions.push(`p.status = $${paramIndex}`);
      whereParams.push(criteria.status);
      paramIndex++;
    }
    
    // Filter by department_id - check for truthy value
    if (criteria.department_id !== undefined && criteria.department_id !== null) {
      whereConditions.push(`p.department_id = $${paramIndex}`);
      whereParams.push(criteria.department_id);
      paramIndex++;
    }

    // Search in position_code or position_name
    if (criteria.search && criteria.search.trim()) {
      const searchTerm = `%${criteria.search.trim()}%`;
      whereConditions.push(`(p.position_code ILIKE $${paramIndex} OR p.position_name ILIKE $${paramIndex + 1})`);
      whereParams.push(searchTerm, searchTerm);
      paramIndex += 2;
    }

    // Validate and sanitize sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'position_code', 'position_name', 'status', 'created_at', 'updated_at', 'level', 'department_id'];
    const sortBy = allowedSortFields.includes(criteria.sortBy) ? criteria.sortBy : 'created_at';
    const sortOrder = criteria.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Build WHERE clause
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM positions p
      ${whereClause}
    `;
    const countResult = await this.positionRepository.query(countQuery, whereParams);
    const total = parseInt(countResult[0]?.total || '0', 10);

    // Main query with pagination
    const queryParams = [...whereParams];
    const limitParamIndex = paramIndex;
    const offsetParamIndex = paramIndex + 1;
    queryParams.push(criteria.limit || 10, criteria.offset || 0);

    const query = `
      SELECT 
        p.*,
        d.department_name
      FROM positions p
      LEFT JOIN departments d ON d.id = p.department_id
      ${whereClause}
      ORDER BY p.${sortBy} ${sortOrder}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const results = await this.positionRepository.query(query, queryParams);
    const positions = results.map((row: any) => {
      const position = PositionMapper.toDomain(row);
      // Add joined field
      (position as any).department_name = row.department_name;
      return position;
    });

    return { positions, total };
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
