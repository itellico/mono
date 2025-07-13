import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../logging/logger.service';

@Injectable()
export class ErrorHandlingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        this.logger.error(`Error occurred: ${error.message}`, error);
        
        // Handle Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return throwError(() => this.handlePrismaError(error));
        }
        
        // Handle validation errors
        if (error instanceof Prisma.PrismaClientValidationError) {
          return throwError(() => new HttpException(
            {
              success: false,
              error: 'VALIDATION_ERROR',
              message: 'Invalid data provided',
              details: error.message,
            },
            HttpStatus.BAD_REQUEST
          ));
        }
        
        // Handle already handled HTTP exceptions
        if (error instanceof HttpException) {
          const response = error.getResponse();
          const status = error.getStatus();
          
          // Format response to match our API standard
          return throwError(() => new HttpException(
            {
              success: false,
              error: typeof response === 'string' ? response : (response as any).error || 'HTTP_ERROR',
              message: typeof response === 'string' ? response : (response as any).message || error.message,
              ...(typeof response === 'object' && response !== null ? { details: response } : {}),
            },
            status
          ));
        }
        
        // Handle unknown errors
        this.logger.error(`Unhandled error: ${error.message}`, error);
        return throwError(() => new HttpException(
          {
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        ));
      })
    );
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        return new HttpException(
          {
            success: false,
            error: 'DUPLICATE_ENTRY',
            message: 'A record with this information already exists',
            details: {
              fields: error.meta?.target,
            },
          },
          HttpStatus.CONFLICT
        );
      
      case 'P2003':
        // Foreign key constraint violation
        return new HttpException(
          {
            success: false,
            error: 'FOREIGN_KEY_CONSTRAINT',
            message: 'Referenced record does not exist',
            details: {
              field: error.meta?.field_name,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2025':
        // Record not found
        return new HttpException(
          {
            success: false,
            error: 'RECORD_NOT_FOUND',
            message: 'The requested record was not found',
          },
          HttpStatus.NOT_FOUND
        );
      
      case 'P2014':
        // Required relation is missing
        return new HttpException(
          {
            success: false,
            error: 'MISSING_RELATION',
            message: 'Required relationship is missing',
            details: {
              relation: error.meta?.relation_name,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2021':
        // Table does not exist
        return new HttpException(
          {
            success: false,
            error: 'TABLE_NOT_FOUND',
            message: 'Database table does not exist',
            details: {
              table: error.meta?.table,
            },
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      
      case 'P2022':
        // Column does not exist
        return new HttpException(
          {
            success: false,
            error: 'COLUMN_NOT_FOUND',
            message: 'Database column does not exist',
            details: {
              column: error.meta?.column,
            },
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      
      case 'P2016':
        // Query interpretation error
        return new HttpException(
          {
            success: false,
            error: 'QUERY_INTERPRETATION_ERROR',
            message: 'Invalid query parameters',
            details: {
              details: error.meta?.details,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2017':
        // Records for relation are not connected
        return new HttpException(
          {
            success: false,
            error: 'RELATION_NOT_CONNECTED',
            message: 'Related records are not properly connected',
            details: {
              relation: error.meta?.relation_name,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2018':
        // Required connected records not found
        return new HttpException(
          {
            success: false,
            error: 'CONNECTED_RECORDS_NOT_FOUND',
            message: 'Required connected records not found',
            details: {
              details: error.meta?.details,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2019':
        // Input error
        return new HttpException(
          {
            success: false,
            error: 'INPUT_ERROR',
            message: 'Invalid input data',
            details: {
              details: error.meta?.details,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2020':
        // Value out of range
        return new HttpException(
          {
            success: false,
            error: 'VALUE_OUT_OF_RANGE',
            message: 'Value is out of range for the field',
            details: {
              details: error.meta?.details,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2023':
        // Inconsistent column data
        return new HttpException(
          {
            success: false,
            error: 'INCONSISTENT_COLUMN_DATA',
            message: 'Inconsistent column data',
            details: {
              message: error.meta?.message,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2024':
        // Timed out fetching a new connection
        return new HttpException(
          {
            success: false,
            error: 'CONNECTION_TIMEOUT',
            message: 'Database connection timed out',
          },
          HttpStatus.SERVICE_UNAVAILABLE
        );
      
      case 'P2026':
        // Unsupported feature
        return new HttpException(
          {
            success: false,
            error: 'UNSUPPORTED_FEATURE',
            message: 'Database feature not supported',
            details: {
              feature: error.meta?.feature,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      case 'P2027':
        // Multiple errors during query execution
        return new HttpException(
          {
            success: false,
            error: 'MULTIPLE_ERRORS',
            message: 'Multiple errors occurred during query execution',
            details: {
              errors: error.meta?.errors,
            },
          },
          HttpStatus.BAD_REQUEST
        );
      
      default:
        // Unknown Prisma error
        return new HttpException(
          {
            success: false,
            error: 'DATABASE_ERROR',
            message: 'A database error occurred',
            details: {
              code: error.code,
              message: error.message,
            },
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }
}