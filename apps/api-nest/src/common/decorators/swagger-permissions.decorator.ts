import { applyDecorators } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiTags
} from '@nestjs/swagger';

/**
 * Enhanced Swagger decorator that includes permission information
 */
export function ApiPermissions(options: {
  summary: string;
  description?: string;
  permissions?: string[];
  roles?: string[];
  tags?: string[];
  isPublic?: boolean;
}) {
  const decorators = [];

  // Add operation documentation
  let description = options.description || '';
  
  // Add permission requirements to description
  if (options.permissions && options.permissions.length > 0) {
    description += `\n\n**Required Permissions:**\n`;
    options.permissions.forEach(permission => {
      description += `- \`${permission}\`\n`;
    });
  }

  // Add role requirements to description
  if (options.roles && options.roles.length > 0) {
    description += `\n\n**Required Roles:**\n`;
    options.roles.forEach(role => {
      description += `- \`${role}\`\n`;
    });
  }

  // Add naming convention note
  description += `\n\n**Permission Format:** \`module.resource.action\``;

  decorators.push(
    ApiOperation({
      summary: options.summary,
      description,
    })
  );

  // Add authentication decorators if not public
  if (!options.isPublic) {
    decorators.push(
      ApiBearerAuth('JWT-auth'),
      ApiCookieAuth('auth-cookie'),
      ApiUnauthorizedResponse({
        description: 'Authentication required',
        schema: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'UNAUTHORIZED' },
            message: { type: 'string', example: 'Authentication required' },
          },
        },
      })
    );

    // Add forbidden response if permissions are required
    if (options.permissions && options.permissions.length > 0) {
      decorators.push(
        ApiForbiddenResponse({
          description: 'Insufficient permissions',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'FORBIDDEN' },
              message: { 
                type: 'string', 
                example: `Access denied. Required permissions: ${options.permissions.join(', ')}` 
              },
            },
          },
        })
      );
    }
  }

  // Add success response
  decorators.push(
    ApiResponse({
      status: 200,
      description: 'Operation successful',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object', description: 'Response data' },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2025-07-12T07:58:00.000Z' },
              version: { type: 'string', example: 'v2' },
            },
          },
        },
      },
    })
  );

  // Add tags if specified
  if (options.tags && options.tags.length > 0) {
    decorators.push(ApiTags(...options.tags));
  }

  return applyDecorators(...decorators);
}

/**
 * Swagger decorator for public endpoints
 */
export function ApiPublic(options: {
  summary: string;
  description?: string;
  tags?: string[];
}) {
  return ApiPermissions({
    ...options,
    isPublic: true,
  });
}

/**
 * Swagger decorator for platform admin endpoints
 */
export function ApiPlatformAdmin(options: {
  summary: string;
  description?: string;
  permissions?: string[];
}) {
  return ApiPermissions({
    ...options,
    roles: ['super_admin', 'platform_admin'],
    tags: ['Platform'],
  });
}

/**
 * Swagger decorator for tenant admin endpoints
 */
export function ApiTenantAdmin(options: {
  summary: string;
  description?: string;
  permissions?: string[];
}) {
  return ApiPermissions({
    ...options,
    roles: ['super_admin', 'platform_admin', 'tenant_admin'],
    tags: ['Tenant'],
  });
}

/**
 * Swagger decorator for account admin endpoints
 */
export function ApiAccountAdmin(options: {
  summary: string;
  description?: string;
  permissions?: string[];
}) {
  return ApiPermissions({
    ...options,
    roles: ['super_admin', 'platform_admin', 'tenant_admin', 'account_admin'],
    tags: ['Account'],
  });
}

/**
 * Swagger decorator for user endpoints
 */
export function ApiUser(options: {
  summary: string;
  description?: string;
  permissions?: string[];
}) {
  return ApiPermissions({
    ...options,
    roles: ['user'],
    tags: ['User'],
  });
}