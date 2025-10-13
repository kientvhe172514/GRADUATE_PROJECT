export interface EmailServicePort {
  send(
    to: string,
    subject: string,
    body: string,
    isHtml?: boolean,
  ): Promise<void>;

  sendBatch(
    recipients: { to: string; subject: string; body: string }[],
  ): Promise<void>;

  sendWithTemplate(
    to: string,
    templateId: string,
    variables: Record<string, any>,
  ): Promise<void>;
}
