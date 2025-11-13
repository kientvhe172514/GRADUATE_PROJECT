import { PushToken, Platform } from '../../../../domain/entities/push-token.entity';
import { PushTokenSchema } from '../schemas/push-token.schema';

export class PushTokenMapper {
  static toDomain(schema: PushTokenSchema): PushToken {
    return new PushToken({
      id: schema.id,
      employeeId: Number(schema.employee_id),
      deviceId: schema.device_id,
      deviceSessionId: schema.device_session_id ? Number(schema.device_session_id) : undefined,
      token: schema.token,
      platform: schema.platform as Platform,
      isActive: schema.is_active,
      lastUsedAt: schema.last_used_at,
      createdAt: schema.created_at,
    });
  }

  static toPersistence(pushToken: PushToken): PushTokenSchema {
    const schema = new PushTokenSchema();
    if (pushToken.id) schema.id = pushToken.id;
    schema.employee_id = pushToken.employeeId;
    schema.device_id = pushToken.deviceId;
    if (pushToken.deviceSessionId !== undefined) {
      schema.device_session_id = pushToken.deviceSessionId;
    }
    schema.token = pushToken.token;
    schema.platform = pushToken.platform;
    schema.is_active = pushToken.isActive;
    schema.last_used_at = pushToken.lastUsedAt;
    schema.created_at = pushToken.createdAt;
    return schema;
  }
}
