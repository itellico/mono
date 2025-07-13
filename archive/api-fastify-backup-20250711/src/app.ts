import Fastify, { FastifyServerOptions } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

// Plugins
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import etag from '@fastify/etag';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import fastifyRedis from '@fastify/redis';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

// Custom plugins
import { prismaPlugin } from './plugins/prisma';
import authPluginV2 from './plugins/auth-v2';
import { tenantPlugin } from './plugins/tenant';
import prometheusPlugin from './plugins/prometheus';
import prismaMonitoringPlugin from './plugins/prisma-monitoring';
import staticFilesPlugin from './plugins/static-files';
import compliantRateLimit from './plugins/compliant-rate-limit';

// Hooks
import { onRequestHooks } from './hooks/onRequest';
import { preHandlerHooks } from './hooks/preHandler';
import { onResponseHooks } from './hooks/onResponse';

// =============================================================================
// ROUTE IMPORTS - New 4-Tier API Structure
// =============================================================================

// New 4-tier API structure
import { v1Routes } from './routes/v1/index';

// Documentation
import { swaggerConfig, swaggerUIConfig } from './config/swagger.config';

import { config } from './config/index';
import { metricsUpdater } from './services/metrics-updater';

export async function buildApp(opts: FastifyServerOptions = {}) {
  const app = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
        connectSrc: ["'self'", "https:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        childSrc: ["'self'"],
        frameSrc: ["'none'"],
        workerSrc: ["'self'"],
        manifestSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false,
  });

  // CORS - Debug enhanced version
  await app.register(cors, {
    origin: (origin, cb) => {
      // Development allowed origins
      const developmentOrigins = [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://app.mono:3000',
        'http://mono.mono:3000',
        'http://app.mono:3001',
        'http://mono.mono:3001'
      ];
      
      // Get CORS_ORIGINS from config (already an array)
      const corsOrigins = config.CORS_ORIGINS;
      
      const allowed = corsOrigins || developmentOrigins;
      
      app.log.info({ 
        origin, 
        allowed, 
        corsOrigins, 
        configCORSORIGINS: config.CORS_ORIGINS,
        NODE_ENV: process.env.NODE_ENV 
      }, 'CORS check started');
      
      // Always allow requests without origin (e.g., mobile apps, Postman)
      if (!origin) {
        app.log.info('CORS: Allowing request without origin');
        return cb(null, true);
      }
      
      // Check exact matches first
      if (allowed.includes(origin)) {
        app.log.info({ origin }, 'CORS: Origin allowed by exact match');
        return cb(null, true);
      }
      
      // For development, be more permissive with localhost and .mono domains
      if (process.env.NODE_ENV === 'development') {
        if (origin.includes('localhost') || origin.endsWith('.mono:3000') || origin.endsWith('.mono:3001')) {
          app.log.info({ origin }, 'CORS: Origin allowed by development pattern match');
          return cb(null, true);
        }
      }
      
      app.log.warn({ origin, allowed, NODE_ENV: process.env.NODE_ENV }, 'CORS origin rejected');
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Core plugins
  await app.register(sensible);
  await app.register(etag);
  
  // File uploads
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
      files: 10,
    },
  });


  // Cookies
  await app.register(cookie, {
    secret: config.JWT_SECRET, // for signed cookies
    parseOptions: {}
  });

  // JWT is registered by auth-v2 plugin

  // Database
  await app.register(prismaPlugin);

  // Redis (must be before auth plugin)
  if (config.REDIS_URL) {
    await app.register(fastifyRedis, {
      url: config.REDIS_URL,
      closeClient: true,
    });
    
    // Compliant rate limiting plugin (requires Redis)
    await app.register(compliantRateLimit);
  }

  // Prometheus metrics
  await app.register(prometheusPlugin);
  
  // Prisma monitoring (must be after both prisma and prometheus)
  await app.register(prismaMonitoringPlugin);

  // Custom plugins
  await app.register(authPluginV2);
  await app.register(tenantPlugin);
  await app.register(staticFilesPlugin);

  // API Documentation
  if (config.NODE_ENV !== 'production') {
    // Register Swagger documentation
    await app.register(swagger, swaggerConfig);
    await app.register(swaggerUI, swaggerUIConfig);
  }

  // Global hooks
  app.addHook('onRequest', onRequestHooks);
  app.addHook('preHandler', preHandlerHooks);
  app.addHook('onResponse', onResponseHooks);

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error, request: request.raw });
    
    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      });
    }

    // Handle JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing authorization header',
      });
    }
    
    // Handle method not allowed
    if (error.statusCode === 405 || error.message?.includes('Method')) {
      return reply.status(405).send({
        success: false,
        error: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed for this endpoint',
      });
    }

    // Default error - never expose sensitive information
    const statusCode = error.statusCode || 500;
    const errorCode = error.code || error.name || 'INTERNAL_ERROR';
    
    // Filter out sensitive keywords from error codes
    const sanitizedError = errorCode
      .replace(/[/\\]/g, '_')
      .replace(/prisma|redis|database|db/gi, 'SERVICE')
      .toUpperCase();
    
    return reply.status(statusCode).send({
      success: false,
      error: sanitizedError,
      message: config.NODE_ENV === 'production' ? 'An error occurred' : error.message,
    });
  });

  // Not found handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  // =============================================================================
  // ROUTE REGISTRATION - New 4-Tier API Structure
  // =============================================================================
  
  // New 4-tier API structure
  // Routes: /api/v1/{public|user|account|tenant|platform}/*
  await app.register(v1Routes, { prefix: '/api/v1' });

  // Start metrics updater for Prometheus
  metricsUpdater.start(10000); // Update every 10 seconds

  return app;
}