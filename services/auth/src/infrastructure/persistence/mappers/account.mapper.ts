import { Account } from '../../../domain/entities/account.entity';
import { AccountEntity } from '../entities/account.entity';

export class AccountMapper {
  static toDomain(entity: AccountEntity): Account {
    const domain = new Account();
    Object.assign(domain, entity);
    domain.external_ids = entity.external_ids;
    domain.metadata = entity.metadata;
    return domain;
  }

  static toPersistence(domain: Account): AccountEntity {
    const entity = new AccountEntity();
    Object.assign(entity, domain);
    entity.external_ids = domain.external_ids || {};
    entity.metadata = domain.metadata || {};
    return entity;
  }
}
