import { Injectable, Logger } from '@nestjs/common';
import { PushNotificationServicePort } from '../../application/ports/push-notification.service.port';

/**
 * Mock Push Notification Service for Development/Testing
 * Logs push notification operations without actually sending them
 */
@Injectable()
export class MockPushService implements PushNotificationServicePort {
  private readonly logger = new Logger(MockPushService.name);

  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.log('🔔 [MOCK] Push notification would be sent to user:');
    this.logger.log(`   User ID: ${userId}`);
    this.logger.log(`   Title: ${title}`);
    this.logger.log(`   Body: ${body}`);
    if (data) {
      this.logger.log(`   Data: ${JSON.stringify(data)}`);
    }
  }

  async sendToDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number; failedTokens: string[] }> {
    this.logger.log('🔔 [MOCK] Push notification would be sent to devices:');
    this.logger.log(`   Tokens: ${deviceTokens.length} device(s)`);
    this.logger.log(`   Title: ${title}`);
    this.logger.log(`   Body: ${body}`);
    if (data) {
      this.logger.log(`   Data: ${JSON.stringify(data)}`);
    }
    return {
      successCount: deviceTokens.length,
      failureCount: 0,
      failedTokens: [],
    };
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.log('🔔 [MOCK] Push notification would be sent to topic:');
    this.logger.log(`   Topic: ${topic}`);
    this.logger.log(`   Title: ${title}`);
    this.logger.log(`   Body: ${body}`);
    if (data) {
      this.logger.log(`   Data: ${JSON.stringify(data)}`);
    }
  }
}
