import { RefreshTokens } from '../../../domain/entities/refresh-tokens.entity';
import { RefreshTokensEntity } from '../entities/refresh-tokens.entity';

export class RefreshTokensMapper {
  static toDomain(entity: RefreshTokensEntity): RefreshTokens {
    const refreshToken = new RefreshTokens();
    refreshToken.id = entity.id;
    refreshToken.account_id = entity.account_id;
    refreshToken.token_hash = entity.token_hash;
    refreshToken.device_id = entity.device_id;
    refreshToken.device_name = entity.device_name;
    refreshToken.device_os = entity.device_os;
    refreshToken.device_fingerprint = entity.device_fingerprint;
    refreshToken.expires_at = entity.expires_at;
    refreshToken.revoked_at = entity.revoked_at;
    refreshToken.last_used_at = entity.last_used_at;
    refreshToken.created_at = entity.created_at;
    return refreshToken;
  }

  static toPersistence(refreshToken: RefreshTokens): RefreshTokensEntity {
    const entity = new RefreshTokensEntity();
    entity.id = refreshToken.id;
    entity.account_id = refreshToken.account_id;
    entity.token_hash = refreshToken.token_hash;
    entity.device_id = refreshToken.device_id;
    entity.device_name = refreshToken.device_name;
    entity.device_os = refreshToken.device_os;
    entity.device_fingerprint = refreshToken.device_fingerprint;
    entity.expires_at = refreshToken.expires_at;
    entity.revoked_at = refreshToken.revoked_at;
    entity.last_used_at = refreshToken.last_used_at;
    entity.created_at = refreshToken.created_at;
    return entity;
  }
}
