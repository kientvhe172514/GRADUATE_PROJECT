import { TemporaryPasswords } from '../../../domain/entities/temporary-passwords.entity';
import { TemporaryPasswordsEntity } from '../entities/temporary-passwords.entity';

export class TemporaryPasswordsMapper {
  static toDomain(entity: TemporaryPasswordsEntity): TemporaryPasswords {
    const tempPassword = new TemporaryPasswords();
    tempPassword.id = entity.id;
    tempPassword.account_id = entity.account_id;
    tempPassword.temp_password_hash = entity.temp_password_hash;
    tempPassword.expires_at = entity.expires_at;
    tempPassword.used_at = entity.used_at;
    tempPassword.must_change_password = entity.must_change_password;
    tempPassword.created_at = entity.created_at;
    return tempPassword;
  }

  static toPersistence(
    tempPassword: TemporaryPasswords,
  ): TemporaryPasswordsEntity {
    const entity = new TemporaryPasswordsEntity();
    entity.id = tempPassword.id;
    entity.account_id = tempPassword.account_id;
    entity.temp_password_hash = tempPassword.temp_password_hash;
    entity.expires_at = tempPassword.expires_at;
    entity.used_at = tempPassword.used_at;
    entity.must_change_password = tempPassword.must_change_password;
    entity.created_at = tempPassword.created_at;
    return entity;
  }
}
