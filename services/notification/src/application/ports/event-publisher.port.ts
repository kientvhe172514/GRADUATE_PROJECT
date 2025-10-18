export interface EventPublisherPort {
  publish(eventName: string, data: any): Promise<void>;
  publishBatch(events: { eventName: string; data: any }[]): Promise<void>;
}
