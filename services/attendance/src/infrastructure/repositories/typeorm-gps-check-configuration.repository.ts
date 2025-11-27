import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GpsCheckConfigurationSchema } from '../persistence/typeorm/gps-check-configuration.schema';
import { IGpsCheckConfigurationRepository } from '../../application/ports/gps-check-configuration.repository.port';
import {
  GpsCheckConfiguration,
  GpsCheckConfigurationProps,
  CheckStrategy,
  ShiftTypeApplicability,
} from '../../domain/entities/gps-check-configuration.entity';

@Injectable()
export class TypeOrmGpsCheckConfigurationRepository
  implements IGpsCheckConfigurationRepository
{
  constructor(
    @InjectRepository(GpsCheckConfigurationSchema)
    private readonly repository: Repository<GpsCheckConfigurationSchema>,
  ) {}

  async findById(id: number): Promise<GpsCheckConfiguration | null> {
    const schema = await this.repository.findOne({ where: { id } });
    return schema ? this.toDomain(schema) : null;
  }

  async findByName(name: string): Promise<GpsCheckConfiguration | null> {
    const schema = await this.repository.findOne({
      where: { config_name: name },
    });
    return schema ? this.toDomain(schema) : null;
  }

  async findAllActive(): Promise<GpsCheckConfiguration[]> {
    const schemas = await this.repository.find({
      where: { is_active: true },
      order: { priority: 'DESC', created_at: 'DESC' },
    });
    return schemas.map((s) => this.toDomain(s));
  }

  async findAll(): Promise<GpsCheckConfiguration[]> {
    const schemas = await this.repository.find({
      order: { priority: 'DESC', created_at: 'DESC' },
    });
    return schemas.map((s) => this.toDomain(s));
  }

  async findDefaultForShiftType(
    shiftType: 'REGULAR' | 'OVERTIME' | 'ALL',
  ): Promise<GpsCheckConfiguration | null> {
    const schema = await this.repository.findOne({
      where: {
        shift_type: shiftType,
        is_default: true,
        is_active: true,
      },
    });
    return schema ? this.toDomain(schema) : null;
  }

  async findBestMatchForShift(
    shiftType: 'REGULAR' | 'OVERTIME',
    shiftDurationHours: number,
  ): Promise<GpsCheckConfiguration | null> {
    // Try to find best match using priority and shift duration
    const query = this.repository
      .createQueryBuilder('config')
      .where('config.is_active = :active', { active: true })
      .andWhere(
        '(config.shift_type = :shiftType OR config.shift_type = :all)',
        {
          shiftType,
          all: 'ALL',
        },
      )
      .andWhere('config.min_shift_duration_hours <= :duration', {
        duration: shiftDurationHours,
      })
      .orderBy('config.priority', 'DESC')
      .addOrderBy(
        'CASE WHEN config.is_default = true THEN 1 ELSE 0 END',
        'DESC',
      )
      .addOrderBy('config.id', 'ASC');

    const schema = await query.getOne();
    return schema ? this.toDomain(schema) : null;
  }

  async save(config: GpsCheckConfiguration): Promise<GpsCheckConfiguration> {
    const schema = this.toSchema(config);
    const saved = await this.repository.save(schema);
    return this.toDomain(saved);
  }

  async update(config: GpsCheckConfiguration): Promise<GpsCheckConfiguration> {
    const schema = this.toSchema(config);
    await this.repository.update(config.id, schema);
    const updated = await this.repository.findOne({ where: { id: config.id } });
    if (!updated) {
      throw new Error('Configuration not found after update');
    }
    return this.toDomain(updated);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async setAsDefault(id: number, shiftType: string): Promise<boolean> {
    await this.repository.manager.transaction(async (manager) => {
      // Unset all defaults for this shift_type
      await manager.update(
        GpsCheckConfigurationSchema,
        { shift_type: shiftType, is_default: true },
        { is_default: false },
      );

      // Set new default
      await manager.update(
        GpsCheckConfigurationSchema,
        { id },
        { is_default: true },
      );
    });

    return true;
  }

  async countActive(): Promise<number> {
    return this.repository.count({ where: { is_active: true } });
  }

  // Mappers
  private toDomain(schema: GpsCheckConfigurationSchema): GpsCheckConfiguration {
    const props: GpsCheckConfigurationProps = {
      id: schema.id,
      config_name: schema.config_name,
      description: schema.description,
      shift_type: schema.shift_type as ShiftTypeApplicability,
      check_strategy: schema.check_strategy as CheckStrategy,
      check_interval_hours: Number(schema.check_interval_hours),
      min_checks_per_shift: schema.min_checks_per_shift,
      max_checks_per_shift: schema.max_checks_per_shift,
      enable_random_timing: schema.enable_random_timing,
      random_offset_minutes: schema.random_offset_minutes,
      min_shift_duration_hours: Number(schema.min_shift_duration_hours),
      default_checks_count: schema.default_checks_count,
      is_active: schema.is_active,
      is_default: schema.is_default,
      priority: schema.priority,
      created_at: schema.created_at,
      created_by: schema.created_by,
      updated_at: schema.updated_at,
      updated_by: schema.updated_by,
    };
    return new GpsCheckConfiguration(props);
  }

  private toSchema(
    domain: GpsCheckConfiguration,
  ): Partial<GpsCheckConfigurationSchema> {
    return {
      id: domain.id || undefined,
      config_name: domain.config_name,
      description: domain.description,
      shift_type: domain.shift_type,
      check_strategy: domain.check_strategy,
      check_interval_hours: domain.check_interval_hours,
      min_checks_per_shift: domain.min_checks_per_shift,
      max_checks_per_shift: domain.max_checks_per_shift,
      enable_random_timing: domain.enable_random_timing,
      random_offset_minutes: domain.random_offset_minutes,
      min_shift_duration_hours: domain.min_shift_duration_hours,
      default_checks_count: domain.default_checks_count,
      is_active: domain.is_active,
      is_default: domain.is_default,
      priority: domain.priority,
    };
  }
}
