import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // If response is already formatted (has success property), return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }
        
        // Handle undefined/null responses
        if (data === undefined || data === null) {
          return {
            success: true,
            data: null,
          };
        }
        
        // Handle pagination responses
        if (data && typeof data === 'object' && 'items' in data && 'pagination' in data) {
          return {
            success: true,
            data: data.items,
            pagination: data.pagination,
          };
        }
        
        // Handle array responses (assume they're data arrays)
        if (Array.isArray(data)) {
          return {
            success: true,
            data,
          };
        }
        
        // Handle primitive responses
        if (typeof data !== 'object') {
          return {
            success: true,
            data,
          };
        }
        
        // Default case: wrap in standard response
        return {
          success: true,
          data,
        };
      })
    );
  }
}