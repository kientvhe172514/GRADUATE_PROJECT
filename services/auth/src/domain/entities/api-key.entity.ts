import { ApiKeyStatus } from '../value-objects/api-key-status.vo';

export class ApiKey {
  id?: number;
  key_hash: string; // bcrypt hash of the API key
  service_name: string; // e.g., 'face-recognition-service', 'reporting-service'
  description?: string;
  status: ApiKeyStatus = ApiKeyStatus.ACTIVE;

  // Security
  allowed_ips?: string[]; // IP whitelist, null = allow all
  rate_limit_per_hour?: number; // null = no limit

  // Permissions
  permissions: string[]; // Array of permission codes
  scope_constraints?: Record<string, any>; // JSON constraints

  // Usage tracking
  last_used_at?: Date;
  last_used_ip?: string;
  usage_count: number = 0;

  // Expiration
  expires_at?: Date;

  // Audit
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
  revoked_at?: Date;
  revoked_by?: number;
}
