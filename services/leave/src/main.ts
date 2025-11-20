import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter, ExtractUserFromHeadersMiddleware } from '@graduate-project/shared-common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from '@graduate-project/shared-common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  app.setGlobalPrefix('api/v1/leave');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Enable structured logging cho tat ca HTTP requests
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Extract user from headers (set by Ingress ForwardAuth)
  // Skip auth in dev mode if SKIP_AUTH=true
  if (configService.get('SKIP_AUTH') !== 'true') {
    app.use(new ExtractUserFromHeadersMiddleware().use);
    console.log('✅ Auth enabled - User extraction from headers active');
  } else {
    console.warn('⚠️  SKIP_AUTH=true - Authentication DISABLED (Dev mode only!)');
  }

  // Hybrid setup: HTTP + RMQ listener for events from Employee service
  // Make RabbitMQ optional in development
  const rabbitmqUrl = configService.get('RABBITMQ_URL');
  const rabbitmqQueue = configService.get('RABBITMQ_LEAVE_QUEUE');
  
  if (rabbitmqUrl && rabbitmqQueue) {
    try {
      app.connectMicroservice<MicroserviceOptions>({
        transport: Transport.RMQ,
        options: {
          urls: [rabbitmqUrl] as string[],
          queue: rabbitmqQueue as string,
          queueOptions: {
            durable: true,
          },
        },
      });
      
      await app.startAllMicroservices();
      console.log('✅ RabbitMQ microservice connected successfully');
    } catch (error) {
      console.warn('⚠️  RabbitMQ connection failed. Running in HTTP-only mode.');
      console.warn('⚠️  Event-driven features will be disabled.');
    }
  } else {
    console.warn('⚠️  RabbitMQ not configured. Running in HTTP-only mode.');
    console.warn('⚠️  Set RABBITMQ_URL and RABBITMQ_LEAVE_QUEUE to enable event-driven features.');
  }
  
  const config = new DocumentBuilder()
    .setTitle('Leave API')
    .setDescription('Leave Service API')
    .setVersion('1.0')
    .addTag('leave')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'bearer',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('leave/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('APP_PORT') || 3003;
  await app.listen(port);
  console.log(`Leave Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api/v1/leave`);
}
bootstrap();