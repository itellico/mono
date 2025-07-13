import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import 'dotenv/config';

const ConfigSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ]),
  PORT: Type.Number({ default: 3001 }),
  HOST: Type.String({ default: '0.0.0.0' }),
  LOG_LEVEL: Type.Union([
    Type.Literal('fatal'),
    Type.Literal('error'),
    Type.Literal('warn'),
    Type.Literal('info'),
    Type.Literal('debug'),
    Type.Literal('trace'),
  ]),
  
  // Database
  DATABASE_URL: Type.String(),
  
  // Redis
  REDIS_URL: Type.Optional(Type.String()),
  
  // RabbitMQ
  RABBITMQ_URL: Type.Optional(Type.String()),
  
  // JWT
  JWT_SECRET: Type.String(),
  JWT_EXPIRES_IN: Type.String({ default: '7d' }),
  JWT_REFRESH_SECRET: Type.String(),
  JWT_REFRESH_EXPIRES_IN: Type.String({ default: '30d' }),
  JWT_PRIVATE_KEY: Type.Optional(Type.String()),
  JWT_PUBLIC_KEY: Type.Optional(Type.String()),
  
  // CORS
  CORS_ORIGINS: Type.Array(Type.String()),
  
  // Rate limiting
  RATE_LIMIT_MAX: Type.Number({ default: 100 }),
  RATE_LIMIT_WINDOW: Type.String({ default: '1 minute' }),
  
  // File uploads
  UPLOAD_DIR: Type.String({ default: './uploads' }),
  MAX_FILE_SIZE: Type.Number({ default: 50 * 1024 * 1024 }), // 50MB
  
  // Storage paths (relative to UPLOAD_DIR)
  MEDIA_PATH: Type.String({ default: 'media' }),
  ARTWORK_PATH: Type.String({ default: 'artwork' }),
  DOCUMENTS_PATH: Type.String({ default: 'documents' }),
  TEMP_PATH: Type.String({ default: 'temp' }),
  
  // Email
  SMTP_HOST: Type.Optional(Type.String()),
  SMTP_PORT: Type.Optional(Type.Number()),
  SMTP_USER: Type.Optional(Type.String()),
  SMTP_PASS: Type.Optional(Type.String()),
  SMTP_FROM: Type.Optional(Type.String()),
  
  // Mailgun
  MAILGUN_API_KEY: Type.Optional(Type.String()),
  MAILGUN_DOMAIN: Type.Optional(Type.String()),
  MAILGUN_HOST: Type.Optional(Type.String()),
  
  // OAuth providers
  GOOGLE_CLIENT_ID: Type.Optional(Type.String()),
  GOOGLE_CLIENT_SECRET: Type.Optional(Type.String()),
  GITHUB_CLIENT_ID: Type.Optional(Type.String()),
  GITHUB_CLIENT_SECRET: Type.Optional(Type.String()),
  
  // Temporal
  TEMPORAL_ADDRESS: Type.Optional(Type.String()),
  TEMPORAL_NAMESPACE: Type.Optional(Type.String()),
  TEMPORAL_TASK_QUEUE: Type.Optional(Type.String()),
  
  // AI Services
  OPENAI_API_KEY: Type.Optional(Type.String()),
  ANTHROPIC_API_KEY: Type.Optional(Type.String()),
});

type Config = Static<typeof ConfigSchema>;

function loadConfig(): Config {
  const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    HOST: process.env.HOST || '0.0.0.0',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    DATABASE_URL: process.env.DATABASE_URL || '',
    REDIS_URL: process.env.REDIS_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    JWT_PRIVATE_KEY: process.env.JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY,
    
    CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    RATE_LIMIT_WINDOW: process.env.RATE_LIMIT_WINDOW || '1 minute',
    
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
    
    MEDIA_PATH: process.env.MEDIA_PATH || 'media',
    ARTWORK_PATH: process.env.ARTWORK_PATH || 'artwork', 
    DOCUMENTS_PATH: process.env.DOCUMENTS_PATH || 'documents',
    TEMP_PATH: process.env.TEMP_PATH || 'temp',
    
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
    MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
    MAILGUN_HOST: process.env.MAILGUN_HOST,
    
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    
    TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS,
    TEMPORAL_NAMESPACE: process.env.TEMPORAL_NAMESPACE,
    TEMPORAL_TASK_QUEUE: process.env.TEMPORAL_TASK_QUEUE,
    
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  };

  // Validate config
  if (!Value.Check(ConfigSchema, env)) {
    const errors = [...Value.Errors(ConfigSchema, env)];
    console.error('Configuration validation failed:', errors);
    throw new Error('Invalid configuration');
  }

  return Value.Cast(ConfigSchema, env);
}

const rawConfig = loadConfig();

export const config = {
  ...rawConfig,
  // Enhanced configuration objects
  redis: {
    url: rawConfig.REDIS_URL || 'redis://localhost:6379'
  },
  rabbitmq: {
    url: rawConfig.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672/mono'
  },
  temporal: {
    address: rawConfig.TEMPORAL_ADDRESS || 'localhost:7233',
    namespace: rawConfig.TEMPORAL_NAMESPACE || 'default',
    taskQueue: rawConfig.TEMPORAL_TASK_QUEUE || 'documentation-queue'
  },
  ai: {
    openai: {
      apiKey: rawConfig.OPENAI_API_KEY,
      available: !!rawConfig.OPENAI_API_KEY
    },
    anthropic: {
      apiKey: rawConfig.ANTHROPIC_API_KEY,
      available: !!rawConfig.ANTHROPIC_API_KEY
    }
  }
};

export const Config = config;