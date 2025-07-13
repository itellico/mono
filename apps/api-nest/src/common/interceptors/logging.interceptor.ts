import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const response = context.switchToHttp().getResponse<FastifyReply>();
    const { method, url, ip, headers } = request;
    
    const userAgent = headers['user-agent'] || '';
    const userId = (request as any).user?.id || 'anonymous';
    const requestId = headers['x-request-id'] || this.generateRequestId();
    
    const startTime = Date.now();
    
    // Log incoming request
    this.logger.info(`📥 ${method} ${url}`, {
      userId,
      ip,
      userAgent: userAgent.substring(0, 100),
      requestId,
      method,
      url,
    });
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = response.statusCode;
          
          // Log successful response with performance tracking
          this.logger.logPerformance(`${method} ${url}`, duration, {
            statusCode,
            userId,
            requestId,
          });
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.getStatus ? error.getStatus() : 500;
          
          // Log error response
          this.logger.error(`❌ ${method} ${url} - ${statusCode} - ${duration}ms`, error, {
            userId,
            requestId,
            method,
            url,
            statusCode,
            duration,
          });
        },
      })
    );
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}