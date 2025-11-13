export class RefreshTokensEntity {
  id?: number;
  account_id: number;
  token_hash: string;
  
  // Device tracking
  device_session_id?: number;
  device_id?: string;
  device_name?: string;
  device_os?: string;
  device_fingerprint?: string;
  
  // Location tracking
  ip_address?: string;
  location?: any;
  user_agent?: string;
  
  // Token lifecycle
  expires_at: Date;
  revoked_at?: Date;
  last_used_at?: Date;
  
  created_at?: Date;
}
