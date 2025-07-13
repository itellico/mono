import { buildApp } from './app';
import { config } from './config/index';

const start = async () => {
  try {
    const app = await buildApp({
      logger: {
        level: config.LOG_LEVEL,
        transport: config.NODE_ENV === 'development' 
          ? { target: 'pino-pretty' }
          : undefined,
      },
      trustProxy: true,
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'requestId',
      connectionTimeout: 30000,
      keepAliveTimeout: 5000,
    });

    await app.listen({
      port: config.PORT,
      host: config.HOST,
    });

    console.log(`🚀 Fastify server running on http://${config.HOST}:${config.PORT}`);
    
    // Graceful shutdown - only add listeners if not already present
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      // Remove existing listeners to prevent memory leaks
      process.removeAllListeners(signal);
      
      process.on(signal, async () => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        await app.close();
        process.exit(0);
      });
    });

    // Increase max listeners to prevent warnings in development
    process.setMaxListeners(20);

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();