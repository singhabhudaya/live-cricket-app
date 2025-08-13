import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseOrigins(): string[] {
  return (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function isAllowed(origin: string, allowlist: string[]): boolean {
  if (allowlist.includes(origin)) return true;
  // support entries like "*.netlify.app"
  try {
    const { host } = new URL(origin);
    for (const pat of allowlist) {
      if (pat.startsWith('*.')) {
        const suf = pat.slice(2);
        if (host === suf || host.endsWith(`.${suf}`)) return true;
      }
    }
  } catch {}
  return false;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowlist = parseOrigins();
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/postman
      cb(null, isAllowed(origin, allowlist));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    // credentials: true, // enable if you ever send cookies
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
