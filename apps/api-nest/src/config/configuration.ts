import * as Joi from 'joi';

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface AppConfig {
  port: number;
  env: string;
  corsOrigins: string[];
  cookieSecret: string;
  jwtSecret: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
}

export const configuration = (): Config => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3001,
    env: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://192.168.178.94:3000'],
    cookieSecret: process.env.COOKIE_SECRET || 'your-cookie-secret',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/itellico_dev',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
});

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  COOKIE_SECRET: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
});