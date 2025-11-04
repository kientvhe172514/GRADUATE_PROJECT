import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter, ExtractUserFromHeadersMiddleware } from '@graduate-project/shared-common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1/employee');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Extract user from headers (set by Ingress ForwardAuth)
  // Skip auth in dev mode if SKIP_AUTH=true
  if (configService.get('SKIP_AUTH') !== 'true') {
    app.use(new ExtractUserFromHeadersMiddleware().use);
    console.log('✅ Auth enabled - User extraction from headers active');
  } else {
    console.warn('⚠️  SKIP_AUTH=true - Authentication DISABLED (Dev mode only!)');
  }

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
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/employee', app, document);

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);
  console.log(`Employee Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api/v1/employee`);
}
bootstrap();