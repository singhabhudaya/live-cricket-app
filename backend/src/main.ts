import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseOrigins() {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowed = new Set(parseOrigins());
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);            // allow curl/postman
      cb(null, allowed.has(origin));
    },
  });

  // keep your existing prefix if you had one
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
