import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from '@graduate-project/shared-common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Hybrid setup: HTTP + RMQ listener for events from Employee service
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow('RABBITMQ_URL')] as string[],
      queue: configService.getOrThrow('RABBITMQ_LEAVE_QUEUE') as string,
      queueOptions: {
        durable: true,
      },
    },
  });
  
  await app.startAllMicroservices();
  
  const config = new DocumentBuilder()
    .setTitle('Leave API')
    .setDescription('Leave Service API')
    .setVersion('1.0')
    .addTag('leave')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('APP_PORT') || 3003;
  await app.listen(port);
  console.log(`Leave Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api`);
}
bootstrap();