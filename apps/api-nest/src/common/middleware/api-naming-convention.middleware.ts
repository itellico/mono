import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Middleware to enforce consistent API naming conventions
 * Standardizes permission names and route parameters to use the same format
 */
@Injectable()
export class ApiNamingConventionMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: FastifyReply, next: () => void) {
    // Track API routes and ensure consistent naming
    this.standardizePermissionNames(req);
    this.validateRouteConventions(req);
    
    next();
  }

  /**
   * Ensure all permission names follow module.resource.action convention
   */
  private standardizePermissionNames(req: FastifyRequest): void {
    // If this is a permission-related request, validate naming
    if (req.body && typeof req.body === 'object') {
      const body = req.body as any;
      if (body.permission || body.permissions) {
        const permissions = Array.isArray(body.permissions) 
          ? body.permissions 
          : [body.permission].filter(Boolean);

        permissions.forEach((permission: string) => {
          if (permission && !this.isValidPermissionName(permission)) {
            console.warn(`⚠️  Invalid permission name format: ${permission}. Expected: module.resource.action`);
          }
        });
      }
    }

    // Check query parameters for permission names
    const query = req.query as any;
    if (query && query.permission && typeof query.permission === 'string') {
      if (!this.isValidPermissionName(query.permission)) {
        console.warn(`⚠️  Invalid permission name format in query: ${query.permission}. Expected: module.resource.action`);
      }
    }
  }

  /**
   * Validate that permission names follow the correct format
   */
  private isValidPermissionName(permission: string): boolean {
    // Expected format: module.resource.action
    const parts = permission.split('.');
    if (parts.length !== 3) {
      return false;
    }

    const [module, resource, action] = parts;
    
    // Check that each part exists and follows naming conventions
    if (!module || !resource || !action) {
      return false;
    }

    // Validate naming patterns
    const validPattern = /^[a-z][a-z0-9_]*$/;
    return validPattern.test(module) && validPattern.test(resource) && validPattern.test(action);
  }

  /**
   * Validate route naming conventions
   */
  private validateRouteConventions(req: FastifyRequest): void {
    const path = req.url;
    
    // Check for inconsistent naming in routes
    const routeSegments = path.split('/').filter(segment => segment.length > 0);
    
    routeSegments.forEach(segment => {
      // Skip dynamic parameters (start with :)
      if (segment.startsWith(':')) {
        return;
      }

      // Skip version prefixes
      if (segment.match(/^(api|v\d+)$/)) {
        return;
      }

      // Check for inconsistent casing or underscores vs hyphens
      if (segment.includes('_') && segment.includes('-')) {
        console.warn(`⚠️  Mixed naming convention in route segment: ${segment}. Use either snake_case or kebab-case consistently.`);
      }

      // Check for camelCase in routes (should be kebab-case)
      if (/[A-Z]/.test(segment)) {
        console.warn(`⚠️  CamelCase detected in route: ${segment}. Consider using kebab-case for consistency.`);
      }
    });
  }
}

/**
 * Decorator to validate permission names in controller methods
 */
export function ValidatePermissionNames() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Validate permission names in request body
      const req = args.find(arg => arg && arg.body !== undefined);
      if (req && req.body) {
        validatePermissionsInRequest(req.body);
      }
      
      return method.apply(this, args);
    };
  };
}

/**
 * Utility function to validate permissions in request objects
 */
function validatePermissionsInRequest(body: any): void {
  if (body.permission && typeof body.permission === 'string') {
    if (!isValidPermissionFormat(body.permission)) {
      throw new Error(`Invalid permission format: ${body.permission}. Expected: module.resource.action`);
    }
  }

  if (Array.isArray(body.permissions)) {
    body.permissions.forEach((permission: string) => {
      if (!isValidPermissionFormat(permission)) {
        throw new Error(`Invalid permission format: ${permission}. Expected: module.resource.action`);
      }
    });
  }
}

/**
 * Check if permission follows the correct naming convention
 */
function isValidPermissionFormat(permission: string): boolean {
  const parts = permission.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [module, resource, action] = parts;
  const validPattern = /^[a-z][a-z0-9_]*$/;
  
  return validPattern.test(module) && validPattern.test(resource) && validPattern.test(action);
}

/**
 * Type definition for standardized API responses
 */
export interface StandardizedApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * Helper function to create standardized API responses
 */
export function createStandardResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): StandardizedApiResponse<T> {
  return {
    success,
    ...(data && { data }),
    ...(error && { error }),
    ...(message && { message }),
    meta: {
      timestamp: new Date().toISOString(),
      version: 'v2',
    },
  };
}