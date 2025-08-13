import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: [
      'https://liveappcricket.netlify.app',
      'http://localhost:5173',
    ],
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS','HEAD'],
    allowedHeaders: ['Content-Type','Authorization'],
    optionsSuccessStatus: 204,
  });

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
