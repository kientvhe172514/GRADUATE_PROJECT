import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokensSchema } from '../typeorm/refresh-tokens.schema';
import { RefreshTokensRepositoryPort } from '../../../application/ports/refresh-tokens.repository.port';
import { RefreshTokens } from '../../../domain/entities/refresh-tokens.entity';
import { RefreshTokensEntity } from '../entities/refresh-tokens.entity';
import { RefreshTokensMapper } from '../mappers/refresh-tokens.mapper';

@Injectable()
export class PostgresRefreshTokensRepository implements RefreshTokensRepositoryPort {
  constructor(
    @InjectRepository(RefreshTokensSchema)
    private repository: Repository<RefreshTokensEntity>,
  ) {}

  async create(refreshToken: RefreshTokens): Promise<RefreshTokens> {
    const entity = RefreshTokensMapper.toPersistence(refreshToken);
    const savedEntity = await this.repository.save(entity);
    return RefreshTokensMapper.toDomain(savedEntity);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokens | null> {
    const entity = await this.repository.findOne({ where: { token_hash: tokenHash } });
    return entity ? RefreshTokensMapper.toDomain(entity) : null;
  }

  async findByAccountId(accountId: number): Promise<RefreshTokens[]> {
    const entities = await this.repository.find({ 
      where: { account_id: accountId },
      order: { created_at: 'DESC' }
    });
    return entities.map(RefreshTokensMapper.toDomain);
  }

  async revokeToken(id: number): Promise<void> {
    await this.repository.update(id, { revoked_at: new Date() });
  }

  async revokeAllTokensForAccount(accountId: number): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ revoked_at: new Date() })
      .where('account_id = :accountId', { accountId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();
  }

  async updateLastUsed(id: number): Promise<void> {
    await this.repository.update(id, { last_used_at: new Date() });
  }
}
