export class ApiKeyEntity {
  id?: number;
  key_hash: string;
  service_name: string;
  description?: string;
  status: string;
  allowed_ips?: string[];
  rate_limit_per_hour?: number;
  permissions: string[];
  scope_constraints?: object;
  last_used_at?: Date;
  last_used_ip?: string;
  usage_count: number;
  expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  updated_by?: number;
  revoked_at?: Date;
  revoked_by?: number;
}
