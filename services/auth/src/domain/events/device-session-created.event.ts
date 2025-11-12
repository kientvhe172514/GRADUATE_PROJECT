export class DeviceSessionCreatedEvent {
  constructor(
    public readonly deviceSessionId: number,
    public readonly accountId: number,
    public readonly employeeId: number | null,
    public readonly deviceId: string,
    public readonly fcmToken: string | null,
    public readonly platform: string,
  ) {}
}
