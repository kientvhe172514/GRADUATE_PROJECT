export enum Platform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export class PushToken {
  id?: number;
  employeeId: number;
  deviceId: string;
  deviceSessionId?: number; // Link to auth service's device_sessions table
  token: string;
  platform: Platform;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;

  constructor(data: Partial<PushToken>) {
    Object.assign(this, data);
    this.isActive = this.isActive ?? true;
    this.lastUsedAt = this.lastUsedAt || new Date();
    this.createdAt = this.createdAt || new Date();
  }

  updateLastUsed(): void {
    this.lastUsedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
    this.updateLastUsed();
  }
}
