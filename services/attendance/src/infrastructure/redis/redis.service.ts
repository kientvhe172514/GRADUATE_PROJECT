import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (!redisUrl) {
      this.logger.warn(
        '⚠️ REDIS_URL not configured. Using default: redis://localhost:6379',
      );
    }

    this.client = new Redis(redisUrl || 'redis://localhost:6379', {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log('✅ Redis connected successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error(`❌ Redis connection error: ${err.message}`);
    });

    this.client.on('ready', () => {
      this.logger.log('🚀 Redis client ready');
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('👋 Redis connection closed');
  }

  /**
   * Get Redis client instance
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Set key-value with optional expiration (in seconds)
   */
  async set(
    key: string,
    value: string,
    expirationSeconds?: number,
  ): Promise<void> {
    if (expirationSeconds) {
      await this.client.setex(key, expirationSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  /**
   * Delete key(s)
   */
  async delete(...keys: string[]): Promise<number> {
    return await this.client.del(...keys);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get TTL (time to live) of a key in seconds
   */
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  /**
   * Set object as JSON with optional expiration
   */
  async setObject<T>(
    key: string,
    value: T,
    expirationSeconds?: number,
  ): Promise<void> {
    const jsonString = JSON.stringify(value);
    await this.set(key, jsonString, expirationSeconds);
  }

  /**
   * Get object from JSON
   */
  async getObject<T>(key: string): Promise<T | null> {
    const jsonString = await this.get(key);
    if (!jsonString) {
      return null;
    }
    return JSON.parse(jsonString) as T;
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  /**
   * Increment value
   */
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  /**
   * Decrement value
   */
  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  /**
   * Set expiration for existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }
}
