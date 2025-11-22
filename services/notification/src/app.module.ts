import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HeaderBasedPermissionGuard } from '@graduate-project/shared-common';
import { NotificationModule } from './application/notification.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'your_secret_key_here'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          __dirname + '/infrastructure/persistence/typeorm/schemas/*.schema{.ts,.js}',
        ],
        // ⚠️ TEMPORARY: Enable synchronize in development until migrations are set up
        synchronize: true,
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    NotificationModule,
  ],
  
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, jwtService: JwtService) => {
        return new HeaderBasedPermissionGuard(reflector, jwtService);
      },
      inject: [Reflector, JwtService],
    },
  ],
})
export class AppModule {}
