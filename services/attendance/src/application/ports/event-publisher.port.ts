/**
 * Event Publisher Port (Interface)
 * 
 * Dependency Inversion Principle:
 * Application layer defines this interface
 * Infrastructure layer provides concrete implementation (RabbitMQ, Kafka, etc.)
 */
export interface IEventPublisher {
  /**
   * Publish a domain event to the message broker
   * 
   * @param event - Event with pattern and data
   * @returns Promise<void>
   */
  publish(event: { pattern: string; data: any }): Promise<void>;
}
