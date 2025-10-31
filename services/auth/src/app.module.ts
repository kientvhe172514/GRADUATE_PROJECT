import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtPermissionGuard } from '@graduate-project/shared-common';
import { AccountModule } from './application/account.module';
import { RbacModule } from './application/rbac.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [
          __dirname + '/infrastructure/persistence/typeorm/*.schema{.ts,.js}',
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'secretKey'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
    AccountModule,
    RbacModule,
  ],
  controllers: [HealthController],
  providers: [
    // Permission guard - no longer needs JwtService as it only checks permissions
    // JWT authentication is handled by JwtAuthGuard
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector) => {
        return new JwtPermissionGuard(reflector);
      },
      inject: [Reflector],
    },
  ],
})
export class AppModule {}