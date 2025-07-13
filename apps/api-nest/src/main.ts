import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import fastifyCookie from '@fastify/cookie';
import { ApiNamingConventionMiddleware } from './common/middleware/api-naming-convention.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      trustProxy: true,
    }),
  );

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://192.168.178.94:3000',
      'http://app.monolocal.com:3000',
      'http://api.monolocal.com:3001'
    ],
    credentials: true,
  });

  // Add API naming convention middleware
  app.use(new ApiNamingConventionMiddleware().use.bind(new ApiNamingConventionMiddleware()));

  // Set global prefix
  app.setGlobalPrefix('api/v2');

  // Setup Swagger documentation with enhanced permission information
  const config = new DocumentBuilder()
    .setTitle('Itellico API v2 - Industry-Grade RBAC')
    .setDescription(`
Multi-tenant SaaS marketplace platform API with 5-tier architecture and comprehensive permission system.

## Authentication
- **JWT Bearer Token**: Include 'Authorization: Bearer <token>' header
- **HTTP-only Cookies**: Automatically handled by browser (preferred for web apps)

## Permission System
- **Format**: All permissions follow \`module.resource.action\` convention
- **Hierarchy**: Platform → Tenant → Account → User → Public
- **Caching**: Permissions are cached for optimal performance
- **Audit**: All permission checks are logged for security

## 5-Tier Architecture
1. **Platform**: Super admin and platform management
2. **Tenant**: Marketplace/organization administration  
3. **Account**: Company/agency account management
4. **User**: Individual user operations
5. **Public**: Unauthenticated access

## Security Features
- HTTP-only cookies prevent XSS attacks
- Resource-level permission checking
- Role hierarchy with inheritance
- Real-time permission validation
- Comprehensive audit logging
    `)
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token for API authentication. Include as: Authorization: Bearer <token>',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('auth-cookie', {
      type: 'apiKey',
      in: 'cookie',
      name: 'auth-token',
      description: 'HTTP-only authentication cookie (automatically handled)',
    })
    // Public Access (Active endpoints)
    .addTag('Public - Health', '🏥 Health checks and system status')
    .addTag('Public - Auth', '🔑 Authentication endpoints')
    .addTag('Countries', '🌍 Countries and regions')
    .addTag('Languages', '🗣️ Languages and locales')
    .addTag('Timezones', '🕐 Timezones and UTC offsets')
    .addTag('Currencies', '💰 Currencies and exchange rates')
    
    // Platform Tier - Active endpoints only
    .addTag('Platform - Core', '⚙️ Core platform operations')
    .addTag('Platform - Management', '👥 Tenant management')
    .addTag('Platform - Monitoring', '📊 System monitoring and health')
    
    // Tenant Tier - Active endpoints only
    .addTag('Tenant - Core', '🏛️ Core tenant operations')
    .addTag('Tenant - Configuration', '⚙️ Settings, schemas, and customization')
    .addTag('Tenant - Advanced', '🚀 Integrations and AI features')
    
    // Account Tier - Active endpoints only
    .addTag('Account - Core', '🏢 Account operations and analytics')
    .addTag('Account - Billing', '💳 Billing and subscriptions')
    
    // User Tier - Active endpoints only
    .addTag('User - Profile', '👤 Profile and settings')
    
    // Shared Services
    .addTag('Metrics', '📈 Prometheus metrics and monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Register Fastify cookie plugin for secure HTTP-only cookie authentication
  await app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET || 'your-secret-key-change-in-production',
    hook: 'onRequest',
    parseOptions: {
      // Default options - individual routes can override
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  });

  const port = process.env.PORT || 3001;
  const host = '0.0.0.0'; // Listen on all interfaces

  await app.listen({
    port: +port,
    host,
  });

  console.log(`🚀 NestJS API with Fastify adapter is running on: http://${host}:${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start the application:', err);
  process.exit(1);
});