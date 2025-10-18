export interface SmsServicePort {
  send(
    phoneNumber: string,
    message: string,
  ): Promise<void>;

  sendBatch(
    recipients: { phoneNumber: string; message: string }[],
  ): Promise<void>;
}
