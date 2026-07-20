import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  
  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Serve static public assets (for local upload fallback)
  app.useStaticAssets(join(process.cwd(), 'public'));

  // Configure Swagger Document
  const config = new DocumentBuilder()
    .setTitle('Famtech Africa - Agricultural Marketplace API')
    .setDescription(
      'The unified, next-generation agritech backend ecosystem for Nigeria. Integrating: \n' +
      '* Auth & Dynamic OTP (Termii SMS / Brevo Email)\n' +
      '* Produce Marketplace & Offline Sync Queue\n' +
      '* Live price dashboards & alerts\n' +
      '* Geolocation radius aggregator queries\n' +
      '* Digital livestock registries & weight calculator\n' +
      '* QR code produce origin verification\n' +
      '* AI Crop disease computer vision\n' +
      '* Real-time Socket.io auctions (with auto-proxy bidding)\n' +
      '* Regulatory export assistant (customs checklists & forms)',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`\n======================================================`);
  console.log(`🚀 Famtech Africa API started on: http://localhost:${port}/api`);
  console.log(`📝 Swagger Docs available at: http://localhost:${port}/api/docs`);
  console.log(`======================================================\n`);
}
bootstrap();
