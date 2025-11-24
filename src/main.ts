import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
  const config = new DocumentBuilder()
    .setTitle('Orders, Voucher & Promotion Management APIs')
    .setDescription(
      'API documentation for orders, voucher & promotion management',
    )
    .setContact(
      'Abdul Samea',
      'https://www.linkedin.com/in/abdul-samea/',
      'abdulsamea2@gmail.com',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth')
    .addTag('Voucher')
    .addTag('Promotion')
    .addTag('Order')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
