import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeySchema } from '../typeorm/api-key.schema';
import { ApiKeyRepositoryPort } from '../../../application/ports/api-key.repository.port';
import { ApiKeyEntity } from '../entities/api-key.entity';

@Injectable()
export class PostgresApiKeyRepository implements ApiKeyRepositoryPort {
  constructor(
    @InjectRepository(ApiKeySchema)
    private repository: Repository<ApiKeyEntity>,
  ) {}

  async findAll(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ apiKeys: any[]; total: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository.createQueryBuilder('api_key');

    if (filters?.status) {
      queryBuilder.where('api_key.status = :status', { status: filters.status });
    }

    const [apiKeys, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('api_key.created_at', 'DESC')
      .getManyAndCount();

    return { apiKeys, total };
  }

  async findById(id: number): Promise<any | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByKey(key: string): Promise<any | null> {
    return await this.repository.findOne({ where: { key } });
  }

  async create(apiKeyData: any): Promise<any> {
    const apiKey = this.repository.create(apiKeyData);
    return await this.repository.save(apiKey);
  }

  async update(id: number, apiKeyData: any): Promise<any> {
    await this.repository.update(id, apiKeyData);
    return await this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async regenerate(id: number, newKey: string): Promise<any> {
    await this.repository.update(id, {
      key: newKey,
      last_rotated_at: new Date(),
    });
    return await this.findById(id);
  }

  async rotate(id: number, newKey: string): Promise<any> {
    const apiKey = await this.findById(id);
    await this.repository.update(id, {
      previous_key: apiKey.key,
      key: newKey,
      last_rotated_at: new Date(),
    });
    return await this.findById(id);
  }

  async getUsageStats(id: number): Promise<any> {
    const result = await this.repository.query(
      `
      SELECT 
        ak.*,
        COALESCE(COUNT(al.id), 0) as total_requests,
        COALESCE(COUNT(al.id) FILTER (WHERE al.success = true), 0) as successful_requests,
        COALESCE(COUNT(al.id) FILTER (WHERE al.success = false), 0) as failed_requests,
        MAX(al.created_at) as last_used_at
      FROM api_keys ak
      LEFT JOIN audit_logs al ON al.api_key_id = ak.id
      WHERE ak.id = $1
      GROUP BY ak.id
    `,
      [id],
    );

    return result[0] || null;
  }

  async incrementUsage(apiKeyId: number): Promise<void> {
    await this.repository.query('UPDATE api_keys SET usage_count = usage_count + 1 WHERE id = $1', [apiKeyId]);
  }
}
