import { z } from 'zod'
import dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') })

/**
 * Environment variables schema for the Fastify API
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_MAX_CONNECTIONS: z.string().transform(Number).pipe(z.number().min(1)).default('20'),
  DATABASE_IDLE_TIMEOUT: z.string().transform(Number).pipe(z.number().min(1000)).default('10000'),

  // Redis
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().transform(Number).pipe(z.number().min(0).max(15)).default('0'),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(20)).default('10'),
  SESSION_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGINS: z.string().transform((val) => val.split(',')),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).pipe(z.number().min(1)).default('100'),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),
  RATE_LIMIT_SKIP_SUCCESS_REQUESTS: z.string().transform((val) => val === 'true').default('false'),

  // File Uploads
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).pipe(z.number().min(1)).default('52428800'),
  ALLOWED_FILE_TYPES: z.string().transform((val) => val.split(',')).optional(),

  // Email
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email(),
  SMTP_SECURE: z.string().transform((val) => val === 'true').default('false'),
  MAILPIT_URL: z.string().url().optional(),

  // External Services
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  TEMPORAL_ADDRESS: z.string().optional(),
  N8N_URL: z.string().url().optional(),

  // Feature Flags
  ENABLE_RATE_LIMITING: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_API_DOCS: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_AUDIT_LOG: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_WEBSOCKETS: z.string().transform((val) => val === 'true').default('false'),

  // Monitoring
  SENTRY_DSN: z.string().url().optional().or(z.literal('')),
  GRAFANA_API_KEY: z.string().optional(),
  PROMETHEUS_METRICS_ENABLED: z.string().transform((val) => val === 'true').default('false'),

  // Development
  PRISMA_HIDE_UPDATE_MESSAGE: z.string().transform((val) => val === 'true').default('true'),
  FORCE_COLOR: z.string().optional(),
})

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

// Export the type for use in other files
export type Env = z.infer<typeof envSchema>