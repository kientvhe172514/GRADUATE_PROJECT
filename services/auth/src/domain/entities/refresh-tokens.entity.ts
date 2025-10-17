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

  constructor(data: Partial<RefreshTokens>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isRevoked(): boolean {
    return !!this.revoked_at;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isRevoked();
  }

  revoke(): void {
    this.revoked_at = new Date();
  }

  updateLastUsed(): void {
    this.last_used_at = new Date();
  }
}