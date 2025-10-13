export class NotificationSentEvent {
  constructor(
    public readonly notificationId: number,
    public readonly recipientId: number,
    public readonly notificationType: string,
    public readonly channels: string[],
    public readonly timestamp: Date = new Date(),
  ) {}
}
