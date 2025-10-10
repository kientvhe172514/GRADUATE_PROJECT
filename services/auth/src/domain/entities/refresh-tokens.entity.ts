export class RefreshTokens {
  id?: number;
  account_id: number;
  token_hash: string;
  
  // Device info
  device_id?: string;
  device_name?: string;
  device_os?: string;
  device_fingerprint?: string;
  
  // Token lifecycle
  expires_at: Date;
  revoked_at?: Date;
  last_used_at?: Date;
  
  created_at?: Date;
}
