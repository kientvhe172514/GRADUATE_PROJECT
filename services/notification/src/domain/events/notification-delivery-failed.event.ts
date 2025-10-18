export class NotificationDeliveryFailedEvent {
  constructor(
    public readonly notificationId: number,
    public readonly channel: string,
    public readonly error: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
