import { OpenAPIV3 } from 'openapi-types';

// 🎯 ITELLICO PLATFORM: OpenAPI Configuration
// Base OpenAPI configuration for itellico

export const openApiConfig: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'itellico API',
    version: '1.0.0',
    description: 'Comprehensive API for the itellico marketplace platform',
    contact: {
      name: 'itellico Development Team',
      url: 'https://docs.itellico.com'
    },
    license: {
      name: 'MIT',
      url: 'https://itellico.com/license'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server'
    },
    {
      url: 'https://staging.itellico.com/api',
      description: 'Staging server'
    },
    {
      url: 'https://api.itellico.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'authjs.session-token',
        description: 'NextAuth.js session cookie'
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      // Common response schemas
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        required: ['success'],
        properties: {
          success: {
            type: 'boolean',
            description: 'Operation success status'
          },
          message: {
            type: 'string',
            description: 'Success message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      },
      PaginationResponse: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            description: 'Current page number'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Items per page'
          },
          total: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of items'
          },
          totalPages: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of pages'
          }
        }
      },

      // User-related schemas
      User: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName'],
        properties: {
          id: {
            type: 'integer',
            description: 'User ID'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address'
          },
          firstName: {
            type: 'string',
            description: 'User first name'
          },
          lastName: {
            type: 'string',
            description: 'User last name'
          },
          isActive: {
            type: 'boolean',
            description: 'User active status'
          },
          isVerified: {
            type: 'boolean',
            description: 'Email verification status'
          },
          role: {
            type: 'string',
            enum: ['user', 'model', 'agency_admin', 'content_moderator', 'tenant_admin', 'super_admin'],
            description: 'User role'
          },
          accountId: {
            type: 'integer',
            description: 'Associated account ID'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp'
          }
        }
      },

      // Media-related schemas
      MediaAsset: {
        type: 'object',
        required: ['id', 'fileName', 'fileType', 'mediaType'],
        properties: {
          id: {
            type: 'integer',
            description: 'Media asset ID'
          },
          fileName: {
            type: 'string',
            description: 'File name'
          },
          originalFileName: {
            type: 'string',
            description: 'Original file name'
          },
          fileType: {
            type: 'string',
            description: 'MIME type'
          },
          mediaType: {
            type: 'string',
            enum: ['photo', 'video', 'audio', 'document'],
            description: 'Media type category'
          },
          fileSize: {
            type: 'integer',
            description: 'File size in bytes'
          },
          dimensions: {
            type: 'object',
            properties: {
              width: { type: 'integer' },
              height: { type: 'integer' }
            }
          },
          url: {
            type: 'string',
            description: 'File URL'
          },
          context: {
            type: 'string',
            enum: ['profile_picture', 'portfolio', 'compcard', 'application', 'document'],
            description: 'Upload context'
          },
          isApproved: {
            type: 'boolean',
            description: 'Content moderation approval status'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },

      // Bulk operation schemas
      BulkUserOperation: {
        type: 'object',
        required: ['userIds', 'action'],
        properties: {
          userIds: {
            type: 'array',
            items: {
              type: 'integer'
            },
            minItems: 1,
            maxItems: 100,
            description: 'Array of user IDs to operate on'
          },
          action: {
            type: 'string',
            enum: ['activate', 'deactivate', 'verify'],
            description: 'Bulk operation to perform'
          },
          data: {
            type: 'object',
            description: 'Additional operation data'
          }
        }
      },

      BulkOperationResult: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            description: 'Operation description'
          },
          processedCount: {
            type: 'integer',
            description: 'Number of users processed'
          },
          action: {
            type: 'string',
            description: 'Action performed'
          },
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/User'
            },
            description: 'Updated users'
          }
        }
      },

      // Search schemas
      ModelSearchParams: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query across names and descriptions'
          },
          location: {
            type: 'string',
            description: 'Location filter'
          },
          ageRange: {
            type: 'string',
            pattern: '^\\d+-\\d+$',
            example: '18-30',
            description: 'Age range in format "min-max"'
          },
          heightRange: {
            type: 'string',
            pattern: '^\\d+-\\d+$',
            example: '160-180',
            description: 'Height range in cm "min-max"'
          },
          experience: {
            type: 'string',
            description: 'Comma-separated experience levels'
          },
          availability: {
            type: 'string',
            enum: ['all', 'available', 'unavailable'],
            default: 'all'
          },
          sortBy: {
            type: 'string',
            enum: ['relevance', 'rating-desc', 'views-desc', 'recent', 'newest', 'price-asc', 'price-desc'],
            default: 'relevance'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50
          },
          offset: {
            type: 'integer',
            minimum: 0,
            default: 0
          }
        }
      },

      ModelProfile: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Model profile ID'
          },
          userId: {
            type: 'integer',
            description: 'Associated user ID'
          },
          stageName: {
            type: 'string',
            description: 'Model stage name'
          },
          dateOfBirth: {
            type: 'string',
            format: 'date',
            description: 'Date of birth'
          },
          height: {
            type: 'integer',
            description: 'Height in cm'
          },
          experienceLevel: {
            type: 'string',
            enum: ['beginner', 'intermediate', 'experienced', 'professional'],
            description: 'Experience level'
          },
          specializations: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Model specializations'
          },
          portfolioDescription: {
            type: 'string',
            description: 'Portfolio description'
          },
          isAvailable: {
            type: 'boolean',
            description: 'Availability status'
          }
        }
      }
    },
    parameters: {
      TenantId: {
        name: 'X-Tenant-ID',
        in: 'header',
        description: 'Tenant identifier for multi-tenant operations',
        required: false,
        schema: {
          type: 'string'
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Unauthorized'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions for this operation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Forbidden'
            }
          }
        }
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Resource not found'
            }
          }
        }
      },
      ValidationError: {
        description: 'Invalid input parameters',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              error: 'Validation failed',
              details: {
                field: 'email',
                message: 'Invalid email format'
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      cookieAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management'
    },
    {
      name: 'Users',
      description: 'User management operations'
    },
    {
      name: 'Admin',
      description: 'Administrative operations (requires elevated permissions)'
    },
    {
      name: 'Media',
      description: 'File upload and media management'
    },
    {
      name: 'Search',
      description: 'Search and discovery operations'
    },
    {
      name: 'Profiles',
      description: 'Model profile management'
    },
    {
      name: 'Portfolio',
      description: 'Portfolio and content management'
    },
    {
      name: 'Jobs',
      description: 'Job posting and application management'
    },
    {
      name: 'Settings',
      description: 'User and system settings'
    },
    {
      name: 'Queue',
      description: 'Background job and queue management'
    }
  ],
  paths: {
    // Paths will be auto-generated from JSDoc comments in API routes
    // This is populated by the OpenAPI generation process
  }
};

// Helper function to create OpenAPI route documentation
export function createOpenApiRoute(spec: Partial<OpenAPIV3.PathItemObject>) {
  return spec;
}

// Helper function to create response schema
export function createResponse(
  description: string,
  schema?: OpenAPIV3.SchemaObject,
  example?: any
): OpenAPIV3.ResponseObject {
  return {
    description,
    content: schema ? {
      'application/json': {
        schema,
        ...(example && { example })
      }
    } : undefined
  };
}

// Common response generators
export const responses = {
  success: (schema?: OpenAPIV3.SchemaObject, example?: any) =>
    createResponse('Operation successful', schema, example),

  created: (schema?: OpenAPIV3.SchemaObject, example?: any) =>
    createResponse('Resource created successfully', schema, example),

  unauthorized: () => ({ $ref: '#/components/responses/UnauthorizedError' }),
  forbidden: () => ({ $ref: '#/components/responses/ForbiddenError' }),
  notFound: () => ({ $ref: '#/components/responses/NotFoundError' }),
  validation: () => ({ $ref: '#/components/responses/ValidationError' })
};

// Security requirements generators
export const security = {
  authenticated: [{ cookieAuth: [] }],
  public: []
}; 