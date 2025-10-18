import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PushNotificationServicePort } from '../../application/ports/push-notification.service.port';
import { PushTokenRepositoryPort } from '../../application/ports/push-token.repository.port';
import { Inject } from '@nestjs/common';
import { PUSH_TOKEN_REPOSITORY } from '../../application/use-cases/register-push-token.use-case';

@Injectable()
export class FirebasePushNotificationService
  implements PushNotificationServicePort, OnModuleInit
{
  private readonly logger = new Logger(FirebasePushNotificationService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject(PUSH_TOKEN_REPOSITORY)
    private readonly pushTokenRepo: PushTokenRepositoryPort,
  ) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin SDK already initialized');
      return;
    }

    try {
      // Option 2: Read from Environment Variables
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
      const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

      if (!projectId || !privateKey || !clientEmail) {
        this.logger.warn(
          'Firebase configuration not found. Push notifications will not work.',
        );
        this.logger.warn('Required env vars: FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL');
        return;
      }

      // Initialize Firebase Admin SDK with credentials from env vars
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey: privateKey.replace(/\\n/g, '\n'), // Convert escaped newlines
          clientEmail,
        }),
      });

      this.logger.log('✅ Firebase Admin SDK initialized successfully from environment variables');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    this.logger.log(`Sending push notification to user ${userId}`);

    // Get all active device tokens for this user
    const tokens = await this.pushTokenRepo.findActiveByEmployeeId(userId);

    if (tokens.length === 0) {
      this.logger.warn(`No active device tokens found for user ${userId}`);
      return;
    }

    const deviceTokens = tokens.map((t) => t.token);
    await this.sendToDevices(deviceTokens, title, body, data);
  }

  async sendToDevices(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{
    successCount: number;
    failureCount: number;
    failedTokens: string[];
  }> {
    if (admin.apps.length === 0) {
      this.logger.error('Firebase not initialized. Cannot send push notifications.');
      return { successCount: 0, failureCount: deviceTokens.length, failedTokens: deviceTokens };
    }

    this.logger.log(`Sending push notification to ${deviceTokens.length} devices`);

    const message: admin.messaging.MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'zentry_notifications',
          priority: 'high',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            contentAvailable: true,
          },
        },
        headers: {
          'apns-priority': '10',
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon.png',
          badge: '/badge.png',
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Push notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      // Handle failed tokens
      const failedTokens: string[] = [];
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(deviceTokens[idx]);
            this.logger.error(
              `Failed to send to token: ${deviceTokens[idx]}, error: ${resp.error?.message}`,
            );
          }
        });

        // Remove invalid tokens from database
        await this.removeInvalidTokens(failedTokens);
      }

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
      throw error;
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (admin.apps.length === 0) {
      this.logger.error('Firebase not initialized. Cannot send push notifications.');
      return;
    }

    this.logger.log(`Sending push notification to topic: ${topic}`);

    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Push notification sent to topic ${topic}: ${response}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification to topic ${topic}:`, error);
      throw error;
    }
  }

  private async removeInvalidTokens(tokens: string[]): Promise<void> {
    this.logger.log(`Removing ${tokens.length} invalid tokens`);

    for (const token of tokens) {
      try {
        await this.pushTokenRepo.deactivateByToken(token);
      } catch (error) {
        this.logger.error(`Failed to deactivate token ${token}:`, error);
      }
    }
  }
}
