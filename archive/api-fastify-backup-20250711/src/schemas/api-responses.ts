import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// GENERIC RESPONSE SCHEMAS
// ============================================================================

/**
 * Standard error response schema
 */
export const ErrorResponseSchema = Type.Object({
  success: Type.Literal(false),
  error: Type.String({ 
    description: 'Machine-readable error code',
    examples: ['ValidationError', 'UnauthorizedError', 'NotFoundError']
  }),
  message: Type.String({ 
    description: 'Human-readable error message' 
  }),
  details: Type.Optional(Type.Object({}, { 
    additionalProperties: true,
    description: 'Additional error context'
  }))
}, { 
  $id: 'ErrorResponse',
  description: 'Standard error response format'
});

/**
 * Standard success response schema (generic)
 */
export const SuccessResponseSchema = <T extends ReturnType<typeof Type.Object>>(dataSchema: T) => 
  Type.Object({
    success: Type.Literal(true),
    data: dataSchema
  }, {
    description: 'Standard success response format'
  });

/**
 * Pagination metadata schema
 */
export const PaginationSchema = Type.Object({
  page: Type.Number({ minimum: 1, default: 1 }),
  limit: Type.Number({ minimum: 1, maximum: 100, default: 20 }),
  total: Type.Number({ minimum: 0 }),
  totalPages: Type.Number({ minimum: 0 })
}, {
  $id: 'Pagination',
  description: 'Pagination metadata'
});

/**
 * Paginated response schema
 */
export const PaginatedResponseSchema = <T extends ReturnType<typeof Type.Array>>(itemsSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    data: Type.Object({
      items: itemsSchema,
      pagination: PaginationSchema
    })
  }, {
    description: 'Paginated response format'
  });

// ============================================================================
// COMMON DATA SCHEMAS
// ============================================================================

/**
 * User schema for API responses
 */
export const UserSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email: Type.String({ format: 'email' }),
  name: Type.String(),
  roles: Type.Array(Type.String()),
  permissions: Type.Array(Type.String()),
  tenantId: Type.Number(),
  accountId: Type.Optional(Type.Number()),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}, {
  $id: 'User',
  description: 'User object'
});

/**
 * Tenant schema for API responses
 */
export const TenantSchema = Type.Object({
  id: Type.Number(),
  uuid: Type.String({ format: 'uuid' }),
  name: Type.String(),
  code: Type.String(),
  domain: Type.Optional(Type.String()),
  settings: Type.Object({}, { additionalProperties: true }),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}, {
  $id: 'Tenant',
  description: 'Tenant object'
});

/**
 * Account schema for API responses
 */
export const AccountSchema = Type.Object({
  id: Type.Number(),
  uuid: Type.String({ format: 'uuid' }),
  name: Type.String(),
  type: Type.Union([
    Type.Literal('personal'),
    Type.Literal('business'),
    Type.Literal('enterprise')
  ]),
  tenantId: Type.Number(),
  ownerId: Type.String({ format: 'uuid' }),
  settings: Type.Object({}, { additionalProperties: true }),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' })
}, {
  $id: 'Account',
  description: 'Account object'
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ErrorResponse = Static<typeof ErrorResponseSchema>;
export type User = Static<typeof UserSchema>;
export type Tenant = Static<typeof TenantSchema>;
export type Account = Static<typeof AccountSchema>;
export type Pagination = Static<typeof PaginationSchema>;

// ============================================================================
// COMMON RESPONSE BUILDERS
// ============================================================================

/**
 * Build a standard error response
 */
export const errorResponse = (
  error: string,
  message: string,
  details?: any
): ErrorResponse => ({
  success: false,
  error,
  message,
  ...(details && { details })
});

/**
 * Build a standard success response
 */
export const successResponse = <T>(data: T) => ({
  success: true,
  data
});

/**
 * Build a paginated response
 */
export const paginatedResponse = <T>(
  items: T[],
  page: number,
  limit: number,
  total: number
) => ({
  success: true,
  data: {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
});