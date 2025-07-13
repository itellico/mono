# API Response Format Standard

> **MANDATORY**: All API endpoints in the itellico Mono MUST follow these standardized response formats.

## 📋 Table of Contents
- [Overview](#overview)
- [Response Formats](#response-formats)
  - [Success Response](#success-response)
  - [Error Response](#error-response)
  - [Paginated Response](#paginated-response)
- [Error Codes](#error-codes)
- [Implementation Guidelines](#implementation-guidelines)
- [Examples](#examples)
- [Validation](#validation)

## Overview

The itellico Mono API uses a consistent response format across all endpoints to ensure predictability and ease of integration. This document defines the **mandatory** response formats that all API endpoints must follow.

## Response Formats

### Success Response

All successful responses MUST follow this format:

```json
{
  "success": true,
  "data": {
    // Response data specific to the endpoint
  }
}
```

**Schema Definition (TypeBox)**:
```typescript
Type.Object({
  success: Type.Literal(true),
  data: Type.Object({}) // Specific to each endpoint
})
```

### Error Response

All error responses MUST follow this format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    // Optional: Additional error details
  }
}
```

**Schema Definition (TypeBox)**:
```typescript
Type.Object({
  success: Type.Literal(false),
  error: Type.String(), // UPPERCASE_SNAKE_CASE error code
  message: Type.String(), // Human-readable message
  details: Type.Optional(Type.Object({}, { additionalProperties: true }))
})
```

**Requirements**:
- `error`: MUST be an UPPERCASE_SNAKE_CASE error code (e.g., `USER_NOT_FOUND`, `VALIDATION_ERROR`)
- `message`: MUST be a human-readable message suitable for display to end users
- `details`: OPTIONAL field for additional context (e.g., validation errors, field-specific issues)

### Paginated Response

All endpoints returning lists MUST use this pagination format:

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**Schema Definition (TypeBox)**:
```typescript
Type.Object({
  success: Type.Literal(true),
  data: Type.Object({
    items: Type.Array(Type.Object({})), // Specific item type
    pagination: Type.Object({
      page: Type.Number({ minimum: 1 }),
      limit: Type.Number({ minimum: 1, maximum: 100 }),
      total: Type.Number({ minimum: 0 }),
      totalPages: Type.Number({ minimum: 0 })
    })
  })
})
```

## Error Codes

Error codes MUST follow these conventions:

### Format
- UPPERCASE_SNAKE_CASE
- Descriptive and specific
- Grouped by category

### Standard Error Codes

#### Authentication & Authorization (401, 403)
- `UNAUTHORIZED` - No valid authentication
- `INVALID_CREDENTIALS` - Wrong username/password
- `TOKEN_EXPIRED` - JWT token has expired
- `TOKEN_INVALID` - Malformed or tampered token
- `PERMISSION_DENIED` - Authenticated but lacks permission
- `FORBIDDEN` - Action not allowed

#### Resource Errors (404)
- `USER_NOT_FOUND` - User does not exist
- `RESOURCE_NOT_FOUND` - Generic resource not found
- `TENANT_NOT_FOUND` - Tenant does not exist
- `ACCOUNT_NOT_FOUND` - Account does not exist

#### Validation Errors (400)
- `VALIDATION_ERROR` - Generic validation failure
- `INVALID_INPUT` - Input format is incorrect
- `MISSING_FIELD` - Required field is missing
- `INVALID_FORMAT` - Field format is incorrect
- `DUPLICATE_ENTRY` - Unique constraint violation

#### Business Logic Errors (422)
- `BUSINESS_RULE_VIOLATION` - Business rule prevented action
- `QUOTA_EXCEEDED` - Usage limit reached
- `INSUFFICIENT_BALANCE` - Not enough credits/balance
- `INVALID_STATE` - Resource in wrong state for operation

#### Server Errors (500+)
- `INTERNAL_ERROR` - Generic server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - Third-party service failed

## Implementation Guidelines

### 1. Use Helper Functions

Create standardized helper functions to ensure consistency:

```typescript
// Success response helper
export function sendSuccess<T>(reply: FastifyReply, data: T, status = 200) {
  return reply.status(status).send({
    success: true,
    data
  });
}

// Error response helper
export function sendError(
  reply: FastifyReply, 
  status: number, 
  error: string, 
  message: string, 
  details?: any
) {
  return reply.status(status).send({
    success: false,
    error,
    message,
    ...(details && { details })
  });
}

// Paginated response helper
export function sendPaginated<T>(
  reply: FastifyReply,
  items: T[],
  page: number,
  limit: number,
  total: number
) {
  return reply.send({
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
}
```

### 2. Schema Definitions

Always define response schemas in your route definitions:

```typescript
fastify.get('/users/:id', {
  schema: {
    response: {
      200: Type.Object({
        success: Type.Literal(true),
        data: Type.Object({
          user: UserSchema
        })
      }),
      404: Type.Object({
        success: Type.Literal(false),
        error: Type.String(),
        message: Type.String(),
        details: Type.Optional(Type.Object({}, { additionalProperties: true }))
      })
    }
  }
}, handler);
```

## Examples

### Success Response Example

```typescript
// ✅ CORRECT
return sendSuccess(reply, {
  user: {
    id: user.id,
    email: user.email,
    name: user.name
  }
});
```

### Error Response Examples

```typescript
// ✅ CORRECT - 404 Not Found
return sendError(
  reply,
  404,
  'USER_NOT_FOUND',
  'The requested user does not exist'
);

// ✅ CORRECT - 400 Validation Error with details
return sendError(
  reply,
  400,
  'VALIDATION_ERROR',
  'Invalid input data provided',
  {
    fields: {
      email: 'Invalid email format',
      age: 'Must be at least 18'
    }
  }
);

// ❌ INCORRECT - Missing error code
return reply.status(404).send({
  success: false,
  error: 'User not found' // This should be error code, not message
});

// ❌ INCORRECT - Missing message field
return reply.status(404).send({
  success: false,
  error: 'USER_NOT_FOUND'
  // Missing message field
});
```

### Paginated Response Example

```typescript
// ✅ CORRECT
const users = await getUsers(offset, limit);
const total = await getUserCount();

return sendPaginated(reply, users, page, limit, total);
```

## Validation

### Automated Testing

All API tests MUST validate response format:

```typescript
describe('API Response Format', () => {
  it('should return success response in correct format', async () => {
    const response = await api.get('/users/123');
    
    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Object)
    });
  });
  
  it('should return error response in correct format', async () => {
    const response = await api.get('/users/nonexistent');
    
    expect(response.body).toMatchObject({
      success: false,
      error: expect.stringMatching(/^[A-Z_]+$/), // UPPERCASE_SNAKE_CASE
      message: expect.any(String),
      // details is optional
    });
  });
});
```

### Code Review Checklist

- [ ] All success responses include `success: true` and `data` object
- [ ] All error responses include `success: false`, `error` code, and `message`
- [ ] Error codes are UPPERCASE_SNAKE_CASE
- [ ] Error messages are human-readable
- [ ] Paginated responses follow the standard format
- [ ] Response schemas are defined in route definitions
- [ ] Helper functions are used for consistency

## Migration Guide

For existing endpoints that don't follow this standard:

1. Identify non-compliant endpoints
2. Update error responses to include both `error` and `message` fields
3. Ensure error codes are UPPERCASE_SNAKE_CASE
4. Update response schemas
5. Test thoroughly
6. Update API documentation

---

**Last Updated**: January 2025  
**Status**: MANDATORY - All new and existing endpoints must comply