import { ReadPacket, WritePacket, Serializer } from '@nestjs/microservices';

/**
 * Custom NestJS RMQ serializer for MassTransit compatibility
 * 
 * MassTransit expects messages in this format at root level:
 * {
 *   "messageId": "...",
 *   "messageType": ["urn:message:..."],
 *   "message": { ... },
 *   "sentTime": "...",
 *   ...
 * }
 * 
 * But NestJS RMQ by default wraps everything in:
 * {
 *   "pattern": "event_name",
 *   "data": { ... }
 * }
 * 
 * This serializer removes the NestJS wrapper and sends the payload directly
 */
export class MassTransitSerializer implements Serializer {
  /**
   * Serialize outgoing messages
   * For MassTransit compatibility, we send the data directly without NestJS wrapper
   */
  serialize(value: any): Buffer {
    // Extract the actual data payload
    const payload = value?.data || value;

    // If payload already looks like a MassTransit envelope (has messageId + messageType)
    // send it directly without wrapping
    if (
      payload &&
      typeof payload === 'object' &&
      'messageId' in payload &&
      'messageType' in payload &&
      'message' in payload
    ) {
      // This is a MassTransit envelope - send as-is (unwrapped)
      return Buffer.from(JSON.stringify(payload));
    }

    // Otherwise, fall back to default NestJS format (for non-MassTransit consumers)
    return Buffer.from(JSON.stringify(value));
  }

  /**
   * Deserialize incoming messages
   * This is for responses - keep NestJS default behavior
   */
  deserialize(value: Buffer): ReadPacket {
    const jsonString = value.toString();
    
    try {
      const parsed = JSON.parse(jsonString);
      return {
        pattern: parsed.pattern || 'default',
        data: parsed.data || parsed,
      };
    } catch (error) {
      // If parsing fails, return raw string
      return {
        pattern: 'default',
        data: jsonString,
      };
    }
  }
}
