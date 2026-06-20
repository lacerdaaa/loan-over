import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Loan Over API')
    .setDescription(
      'Financial API for debt tracking and cash-flow projection. ' +
        'Core feature: a stateless projection engine that simulates N months forward, ' +
        'detects debt payoff moments, and surfaces them as cash-liberation events.',
    )
    .setVersion('1.0')
    .addTag('income', 'Fixed and variable income sources')
    .addTag('debts', 'Debt tracking and installment payment')
    .addTag('fixed-expenses', 'Monthly recurring expenses (non-debt)')
    .addTag('snapshot', 'Current month computed cash-flow view')
    .addTag('projection', 'N-month forward cash-flow projection')
    .addTag('goal', 'Savings goal tracking')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
