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

  // Hybrid setup: HTTP + RMQ listener for events from IAM (e.g., account_created)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow('RABBITMQ_URL')] as string[],  // Fix: Explicit as string[]
      queue: configService.getOrThrow('RABBITMQ_EMPLOYEE_QUEUE') as string,  
      queueOptions: {
        durable: true,
      },
    },
  });
  await app.startAllMicroservices();  // Start listener
  const config = new DocumentBuilder()
    .setTitle('Employee API')
    .setDescription('Employee Service API')
    .setVersion('1.0')
    .addTag('employees')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`Employee Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api`);
}
bootstrap();