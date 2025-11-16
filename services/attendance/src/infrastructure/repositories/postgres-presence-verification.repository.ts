import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PresenceVerificationRepositoryPort } from '../../application/ports/presence-verification.repository.port';
import { PresenceVerificationRoundEntity } from '../../domain/entities/presence-verification-round.entity';
import { PresenceVerificationRoundSchema } from '../database/schemas/presence-verification-round.schema';

/**
 * PostgreSQL implementation of Presence Verification Repository
 */
@Injectable()
export class PostgresPresenceVerificationRepository implements PresenceVerificationRepositoryPort {
  constructor(
    @InjectRepository(PresenceVerificationRoundSchema)
    private readonly repository: Repository<PresenceVerificationRoundSchema>,
  ) {}

  async create(round: PresenceVerificationRoundEntity): Promise<PresenceVerificationRoundEntity> {
    const schema = PresenceVerificationRoundSchema.fromDomain(round);
    const saved = await this.repository.save(schema);
    return saved.toDomain();
  }

  async findById(id: number): Promise<PresenceVerificationRoundEntity | null> {
    const schema = await this.repository.findOne({ where: { id: String(id) } });
    return schema ? schema.toDomain() : null;
  }

  async findByShiftId(shiftId: number): Promise<PresenceVerificationRoundEntity[]> {
    const schemas = await this.repository.find({
      where: { shift_id: String(shiftId) },
      order: { round_number: 'ASC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async findByShiftIdAndRoundNumber(
    shiftId: number,
    roundNumber: number,
  ): Promise<PresenceVerificationRoundEntity | null> {
    const schema = await this.repository.findOne({
      where: {
        shift_id: String(shiftId),
        round_number: roundNumber,
      },
    });
    return schema ? schema.toDomain() : null;
  }

  async findByEmployeeId(employeeId: number): Promise<PresenceVerificationRoundEntity[]> {
    const schemas = await this.repository.find({
      where: { employee_id: String(employeeId) },
      order: { captured_at: 'DESC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }

  async countByShiftId(shiftId: number): Promise<number> {
    return await this.repository.count({
      where: { shift_id: String(shiftId) },
    });
  }

  async update(
    id: number,
    data: Partial<PresenceVerificationRoundEntity>,
  ): Promise<PresenceVerificationRoundEntity> {
    await this.repository.update(String(id), data as any);
    const updated = await this.repository.findOne({ where: { id: String(id) } });
    if (!updated) {
      throw new Error(`Verification round ${id} not found`);
    }
    return updated.toDomain();
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findInvalidRounds(shiftId: number): Promise<PresenceVerificationRoundEntity[]> {
    const schemas = await this.repository.find({
      where: {
        shift_id: shiftId as any,
        is_valid: false,
      },
      order: { round_number: 'ASC' },
    });
    return schemas.map((schema) => schema.toDomain());
  }
}
