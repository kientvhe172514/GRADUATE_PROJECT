export interface EventPublisherPort {
  publish(eventName: string, data: any): void;
}