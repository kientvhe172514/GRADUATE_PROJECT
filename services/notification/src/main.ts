import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  
  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Hybrid setup: HTTP + RabbitMQ listener for events from other services
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
  const rabbitmqQueue = configService.get<string>('RABBITMQ_NOTIFICATION_QUEUE', 'notification_queue');
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: rabbitmqQueue,
      queueOptions: {
        durable: true,
      },
    },
  });

  // Start microservice listener
  await app.startAllMicroservices();
  logger.log(`📬 RabbitMQ consumer listening on queue: ${rabbitmqQueue}`);

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Notification Service API')
    .setDescription('Notification & Push Token Management API')
    .setVersion('1.0')
    .addTag('notifications', 'Notification management endpoints')
    .addTag('push-tokens', 'Push token registration endpoints')
    .addTag('preferences', 'Notification preference settings')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/notification', app, document);

  const port = configService.get('APP_PORT', 3004);
  await app.listen(port);

  logger.log(`🚀 Notification Service is running on port ${port}`);
  logger.log(`📝 Environment: ${configService.get('NODE_ENV', 'development')}`);
  logger.log(`💚 Health check: http://localhost:${port}/health`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/v1/notification`);
}

bootstrap();