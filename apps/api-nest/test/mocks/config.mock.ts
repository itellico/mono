/**
 * Configuration Service Mock
 * Provides mock configuration for testing
 */

export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      // Database
      'database.url': 'postgresql://itellico:itellico123@localhost:5433/itellico_test',
      'database.host': 'localhost',
      'database.port': 5433,
      'database.name': 'itellico_test',
      'database.username': 'itellico',
      'database.password': 'itellico123',

      // Redis
      'redis.host': 'localhost',
      'redis.port': 6380,
      'redis.password': '',
      'redis.db': 0,

      // JWT
      'jwt.secret': 'test-secret-key-for-jwt-testing',
      'jwt.expiresIn': '1h',
      'jwt.refreshExpiresIn': '7d',

      // App
      'app.port': 3101,
      'app.globalPrefix': 'api',
      'app.name': 'itellico API',
      'app.version': '2.0.0',
      'app.environment': 'test',

      // CORS
      'cors.origin': ['http://localhost:3100'],
      'cors.credentials': true,

      // Rate limiting
      'rateLimit.ttl': 60,
      'rateLimit.limit': 100,

      // File upload
      'upload.maxFileSize': 10485760, // 10MB
      'upload.allowedMimeTypes': ['image/jpeg', 'image/png', 'application/pdf'],

      // Email (mock for testing)
      'email.smtp.host': 'localhost',
      'email.smtp.port': 4025,
      'email.smtp.secure': false,
      'email.from': 'test@itellico.com',

      // Security
      'security.bcryptRounds': 10,
      'security.sessionSecret': 'test-session-secret',
      
      // Monitoring
      'monitoring.enabled': false,
      'metrics.enabled': true,
    };

    return config[key] ?? defaultValue;
  }),

  getOrThrow: jest.fn((key: string) => {
    const value = mockConfigService.get(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value;
  }),
};

/**
 * Test configuration object
 */
export const testConfig = {
  database: {
    url: 'postgresql://itellico:itellico123@localhost:5433/itellico_test',
    host: 'localhost',
    port: 5433,
    name: 'itellico_test',
    username: 'itellico',
    password: 'itellico123',
  },
  redis: {
    host: 'localhost',
    port: 6380,
    password: '',
    db: 0,
  },
  jwt: {
    secret: 'test-secret-key-for-jwt-testing',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  app: {
    port: 3101,
    globalPrefix: 'api',
    name: 'itellico API',
    version: '2.0.0',
    environment: 'test',
  },
  cors: {
    origin: ['http://localhost:3100'],
    credentials: true,
  },
  rateLimit: {
    ttl: 60,
    limit: 100,
  },
};

/**
 * Reset config mock
 */
export function resetConfigMock() {
  mockConfigService.get.mockReset();
  mockConfigService.getOrThrow.mockReset();
}