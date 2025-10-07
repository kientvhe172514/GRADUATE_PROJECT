import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Hybrid setup: HTTP + RMQ listener for events (e.g., employee_created from Employee service)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow('RABBITMQ_URL') as string],
      queue: configService.getOrThrow('RABBITMQ_IAM_QUEUE') as string,
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
    .addTag('accounts')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`IAM Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api`);
  console.log(`RMQ listener on queue: ${configService.getOrThrow('RABBITMQ_IAM_QUEUE')}`);
}
bootstrap();