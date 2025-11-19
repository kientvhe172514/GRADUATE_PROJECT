import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable cookie parsing for HttpOnly cookies
  app.use(cookieParser());

  // Enable CORS with credentials support for cookies
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', '*').split(','),
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-User-Email', 'X-User-Role', 'X-User-Permissions'],
  });

  app.setGlobalPrefix('api/v1/auth');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Hybrid setup: HTTP + RMQ listener for events (e.g., employee_created from Employee service)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow<string>('RABBITMQ_URL')],
      queue: configService.getOrThrow<string>('RABBITMQ_IAM_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();  // Start the listener

  const config = new DocumentBuilder()
    .setTitle('IAM API')
    .setDescription('Auth Service API')
    .setVersion('1.0')
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
  SwaggerModule.setup('auth/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`IAM Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api/v1/auth`);
  console.log(
    `RMQ listener on queue: ${configService.getOrThrow('RABBITMQ_IAM_QUEUE')}`,
  );
}
bootstrap();