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
  
  app.setGlobalPrefix('api/v1/reporting');
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
  
  // Hybrid setup: HTTP + RMQ listener for events from Attendance & Leave services
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.getOrThrow('RABBITMQ_URL')] as string[],
      queue: configService.getOrThrow('RABBITMQ_REPORTING_QUEUE') as string,
      queueOptions: {
        durable: true,
      },
    },
  });
  
  await app.startAllMicroservices();
  
  const config = new DocumentBuilder()
    .setTitle('Reporting API')
    .setDescription('Reporting Service API')
    .setVersion('1.0')
    .addTag('reporting')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/reporting', app, document);

  const port = configService.get('APP_PORT') || 3005;
  await app.listen(port);
  console.log(`Reporting Service running on http://localhost:${port}`);
  console.log(`Swagger at http://localhost:${port}/api/v1/reporting`);
}
bootstrap();