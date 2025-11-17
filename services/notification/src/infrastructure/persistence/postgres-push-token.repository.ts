import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PushToken } from '../../domain/entities/push-token.entity';
import { PushTokenRepositoryPort } from '../../application/ports/push-token.repository.port';
import { PushTokenSchema } from './typeorm/schemas/push-token.schema';
import { PushTokenMapper } from './typeorm/mappers/push-token.mapper';

@Injectable()
export class PostgresPushTokenRepository implements PushTokenRepositoryPort {
  constructor(
    @InjectRepository(PushTokenSchema)
    private readonly repository: Repository<PushTokenSchema>,
  ) {}

  async create(token: PushToken): Promise<PushToken> {
    const schema = PushTokenMapper.toPersistence(token);
    const saved = await this.repository.save(schema);
    return PushTokenMapper.toDomain(saved);
  }

  async findByEmployeeId(employeeId: number): Promise<PushToken[]> {
    const schemas = await this.repository.find({
      where: { employee_id: employeeId },
    });
    return schemas.map(PushTokenMapper.toDomain);
  }

  async findActiveByEmployeeId(employeeId: number): Promise<PushToken[]> {
    console.log(`🔍 [PUSH_TOKEN_REPO] Searching for active tokens: employee_id = ${employeeId}`);
    
    const schemas = await this.repository.find({
      where: {
        employee_id: employeeId,
        is_active: true,
      },
    });
    
    console.log(`🔍 [PUSH_TOKEN_REPO] Found ${schemas.length} active tokens for employee ${employeeId}`);
    
    if (schemas.length > 0) {
      schemas.forEach((s, i) => {
        console.log(`   Token ${i + 1}: device_id=${s.device_id}, platform=${s.platform}, device_session_id=${s.device_session_id}, token_preview=${s.token?.substring(0, 20)}...`);
      });
    } else {
      // Debug: Check if ANY tokens exist for this employee (even inactive ones)
      const allTokens = await this.repository.find({
        where: { employee_id: employeeId },
      });
      console.log(`   ℹ️ Total tokens (including inactive) for employee ${employeeId}: ${allTokens.length}`);
      
      if (allTokens.length > 0) {
        console.log(`   ⚠️ Found ${allTokens.length} inactive tokens:`);
        allTokens.forEach((t, i) => {
          console.log(`      Token ${i + 1}: device_id=${t.device_id}, is_active=${t.is_active}, device_session_id=${t.device_session_id}`);
        });
      }
    }
    
    return schemas.map(PushTokenMapper.toDomain);
  }

  async findByDeviceId(
    employeeId: number,
    deviceId: string,
  ): Promise<PushToken | null> {
    const schema = await this.repository.findOne({
      where: {
        employee_id: employeeId,
        device_id: deviceId,
      },
    });
    return schema ? PushTokenMapper.toDomain(schema) : null;
  }

  async findByDeviceSessionId(deviceSessionId: number): Promise<PushToken | null> {
    const schema = await this.repository.findOne({
      where: {
        device_session_id: deviceSessionId,
      },
    });
    return schema ? PushTokenMapper.toDomain(schema) : null;
  }

  async update(token: PushToken): Promise<PushToken> {
    const schema = PushTokenMapper.toPersistence(token);
    const updated = await this.repository.save(schema);
    return PushTokenMapper.toDomain(updated);
  }

  async deactivateByToken(token: string): Promise<void> {
    await this.repository.update({ token }, { is_active: false });
  }

  async deactivateByDeviceId(
    employeeId: number,
    deviceId: string,
  ): Promise<void> {
    await this.repository.update(
      { employee_id: employeeId, device_id: deviceId },
      { is_active: false },
    );
  }

  async deactivateByDeviceSessionId(deviceSessionId: number): Promise<void> {
    await this.repository.update(
      { device_session_id: deviceSessionId },
      { is_active: false },
    );
  }

  async deleteInactive(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.repository.delete({
      is_active: false,
      last_used_at: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }
}
