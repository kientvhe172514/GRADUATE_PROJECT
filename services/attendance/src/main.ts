import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  HttpExceptionFilter,
  ExtractUserFromHeadersMiddleware,
} from '@graduate-project/shared-common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from '@graduate-project/shared-common';



async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1/attendance');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable structured logging cho tat ca HTTP requests
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Extract user from headers (set by Ingress ForwardAuth)
  // Skip auth in dev mode if SKIP_AUTH=true
  if (configService.get('SKIP_AUTH') !== 'true') {
    const middleware = new ExtractUserFromHeadersMiddleware();
    app.use(middleware.use.bind(middleware));
    console.log('✅ Auth enabled - User extraction from headers active');
  } else {
    console.warn(
      '⚠️  SKIP_AUTH=true - Authentication DISABLED (Dev mode only!)',
    );
  }

  // Hybrid setup: HTTP + RMQ listener for events from Employee & Leave services
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow('RABBITMQ_URL')] as string[],
      queue: configService.getOrThrow('RABBITMQ_ATTENDANCE_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();

  const config = new DocumentBuilder()
    .setTitle('Attendance API')
    .setDescription('Attendance Service API')
    .setVersion('1.0')
    .addTag('attendance')
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
  SwaggerModule.setup('attendance/swagger', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>('APP_PORT') ?? 3004;
  await app.listen(port);
  console.log(`Attendance Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api/v1/attendance`);
}

void bootstrap();
