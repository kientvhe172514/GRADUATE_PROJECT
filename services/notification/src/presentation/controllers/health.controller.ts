import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async check() {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV'),
      checks: {
        database: await this.checkDatabase(),
      },
    };

    return health;
  }

  private async checkDatabase(): Promise<{ status: string; message?: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'healthy' };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }
}
