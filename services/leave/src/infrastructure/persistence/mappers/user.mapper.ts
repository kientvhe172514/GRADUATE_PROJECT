import { User } from '../../../domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(entity: UserEntity): User {
    return new User(entity.id.toString(), entity.username, entity.passwordHash, entity.role);
  }

  static toEntity(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = parseInt(domain.id);
    entity.username = domain.username;
    entity.passwordHash = domain.passwordHash;
    entity.role = domain.role;
    return entity;
  }
}