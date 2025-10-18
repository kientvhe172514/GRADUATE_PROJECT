export class NotificationReadEvent {
  constructor(
    public readonly notificationId: number,
    public readonly recipientId: number,
    public readonly readAt: Date = new Date(),
  ) {}
}
