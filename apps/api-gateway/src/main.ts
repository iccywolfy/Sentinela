import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // ── Security headers (Annex B SEC-10) ────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );

  // ── CORS — allowlist-based (Annex B SEC-05) ───────────────────────────────
  const allowedOrigins = config
    .get<string>('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, curl, Swagger)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 3600,
  });

  // ── Global API prefix ────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Validation — strict input validation ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: config.get<string>('NODE_ENV') === 'production',
    }),
  );

  // ── Global guards — JWT + RBAC enforced everywhere except @Public() ───────
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // ── Global exception filter — RFC 7807 Problem Details ───────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Logging interceptor — correlation IDs ─────────────────────────────────
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── OpenAPI / Swagger ────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SENTINELA API Gateway')
    .setDescription('Global Intelligence Fusion Platform — REST API v1')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addTag('auth', 'Authentication and session management')
    .addTag('events', 'Intelligence events')
    .addTag('alerts', 'Alert management')
    .addTag('workspace', 'Investigation workspace')
    .addTag('reports', 'Report generation')
    .addTag('health', 'Health checks')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`SENTINELA API Gateway running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
