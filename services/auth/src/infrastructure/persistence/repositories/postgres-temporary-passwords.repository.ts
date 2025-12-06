import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemporaryPasswordsSchema } from '../typeorm/temporary-passwords.schema';
import { TemporaryPasswordsRepositoryPort } from '../../../application/ports/temporary-passwords.repository.port';
import { TemporaryPasswords } from '../../../domain/entities/temporary-passwords.entity';
import { TemporaryPasswordsEntity } from '../entities/temporary-passwords.entity';
import { TemporaryPasswordsMapper } from '../mappers/temporary-passwords.mapper';

@Injectable()
export class PostgresTemporaryPasswordsRepository
  implements TemporaryPasswordsRepositoryPort
{
  constructor(
    @InjectRepository(TemporaryPasswordsSchema)
    private repository: Repository<TemporaryPasswordsEntity>,
  ) {}

  async create(tempPassword: TemporaryPasswords): Promise<TemporaryPasswords> {
    const entity = TemporaryPasswordsMapper.toPersistence(tempPassword);
    const savedEntity = await this.repository.save(entity);
    return TemporaryPasswordsMapper.toDomain(savedEntity);
  }

  async findByAccountId(accountId: number): Promise<TemporaryPasswords[]> {
    const entities = await this.repository.find({
      where: { account_id: accountId },
      order: { created_at: 'DESC' },
    });
    return entities.map(TemporaryPasswordsMapper.toDomain);
  }

  async findActiveByAccountId(
    accountId: number,
  ): Promise<TemporaryPasswords | null> {
    const entity = await this.repository
      .createQueryBuilder('temp_passwords')
      .where('temp_passwords.account_id = :accountId', { accountId })
      .andWhere('temp_passwords.expires_at > :now', { now: new Date() })
      .andWhere('temp_passwords.used_at IS NULL')
      .orderBy('temp_passwords.created_at', 'DESC')
      .getOne();

    return entity ? TemporaryPasswordsMapper.toDomain(entity) : null;
  }

  async markAsUsed(id: number): Promise<void> {
    await this.repository.update(id, { used_at: new Date() });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  async deleteByAccountId(accountId: number): Promise<void> {
    await this.repository.delete({ account_id: accountId });
  }

  async findById(id: number): Promise<TemporaryPasswords | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? TemporaryPasswordsMapper.toDomain(entity) : null;
  }
}
