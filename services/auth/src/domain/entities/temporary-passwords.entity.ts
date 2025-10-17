export class TemporaryPasswords {
  id?: number;
  account_id: number;
  temp_password_hash: string;
  expires_at: Date;
  used_at?: Date;
  must_change_password: boolean = true;
  created_at?: Date;

  constructor(data: Partial<TemporaryPasswords>) {
    Object.assign(this, data);
    this.created_at = this.created_at || new Date();
  }

  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  isUsed(): boolean {
    return !!this.used_at;
  }

  isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  markAsUsed(): void {
    this.used_at = new Date();
  }
}