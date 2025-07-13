import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.generateCacheKey(request);

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check cache
    const cachedResponse = await this.redisService.get(cacheKey);
    if (cachedResponse) {
      console.log(`Cache hit: ${cacheKey}`);
      return of(cachedResponse);
    }

    // If not cached, proceed and cache the response
    console.log(`Cache miss: ${cacheKey}`);
    return next.handle().pipe(
      tap(async (response) => {
        // Cache for 5 minutes by default
        await this.redisService.set(cacheKey, response, 300);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    // Include user context in cache key for multi-tenant isolation
    const userId = request.user?.id || 'anonymous';
    const tenantId = request.tenant?.id || 'public';
    const url = request.url;
    
    return `cache:${tenantId}:${userId}:${url}`;
  }
}