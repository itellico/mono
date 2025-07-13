import { Global, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const environment = configService.get('NODE_ENV', 'development');
        const logLevel = configService.get('LOG_LEVEL', 'info');
        const appName = configService.get('app.name', 'api-nest');
        
        return {
          pinoHttp: {
            name: appName,
            level: logLevel,
            transport: environment === 'development' ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
                hideObject: false,
                customColors: 'info:blue,warn:yellow,error:red',
                customLevels: 'silent:100,fatal:60,error:50,warn:40,info:30,debug:20,trace:10',
              },
            } : undefined,
            serializers: {
              req: (req: any) => ({
                method: req.method,
                url: req.url,
                headers: {
                  'user-agent': req.headers['user-agent'],
                  'x-forwarded-for': req.headers['x-forwarded-for'],
                  'x-request-id': req.headers['x-request-id'],
                },
                remoteAddress: req.remoteAddress,
                remotePort: req.remotePort,
              }),
              res: (res: any) => ({
                statusCode: res.statusCode,
                headers: {
                  'content-type': res.headers['content-type'],
                  'content-length': res.headers['content-length'],
                },
              }),
              err: (err: any) => ({
                type: err.constructor.name,
                message: err.message,
                stack: err.stack,
                code: err.code,
                statusCode: err.statusCode,
              }),
            },
            customProps: (req: any) => ({
              user_id: req.user?.id,
              userTier: req.user?.tier,
              tenant_id: req.user?.tenantId,
              account_id: req.user?.accountId,
              requestId: req.headers['x-request-id'] || req.id,
            }),
            customLogLevel: (req: any, res: any, err: any) => {
              if (res.statusCode >= 500 || err) {
                return 'error';
              }
              if (res.statusCode >= 400) {
                return 'warn';
              }
              if (res.statusCode >= 300) {
                return 'info';
              }
              return 'info';
            },
            customSuccessMessage: (req: any, res: any) => {
              return `${req.method} ${req.url} - ${res.statusCode}`;
            },
            customErrorMessage: (req: any, res: any, err: any) => {
              return `${req.method} ${req.url} - ${res.statusCode} - ${err.message}`;
            },
            customAttributeKeys: {
              req: 'request',
              res: 'response',
              err: 'error',
              responseTime: 'duration',
            },
            // Auto-log requests and responses
            autoLogging: {
              ignore: (req: any) => {
                // Ignore health check and metrics endpoints
                return req.url === '/health' || req.url === '/metrics';
              },
            },
          },
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [LoggerModule, LoggerService],
})
export class LoggingModule {}