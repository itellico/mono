---
title: API Documentation
sidebar_label: API Reference
---

# API Documentation

This section contains comprehensive API documentation for the itellico Mono platform.

## Overview

The itellico Mono API follows a 5-tier architecture pattern:

```
Platform → Tenant → Account → User → Public
```

All API endpoints follow the pattern: `/api/v1/{tier}/{resource}/{action}`

## API Tiers

### Platform Tier (`/api/v1/platform/*`)
- System-wide administration
- Tenant management
- Global configuration
- Platform analytics

### Tenant Tier (`/api/v1/tenant/*`)
- Tenant-specific administration
- User management within tenant
- Tenant configuration
- Tenant analytics

### Account Tier (`/api/v1/account/*`)
- Account/business unit operations
- Team management
- Account billing
- Account settings

### User Tier (`/api/v1/user/*`)
- Individual user operations
- Personal settings
- User profile management
- User activity

### Public Tier (`/api/v1/public/*`)
- Authentication endpoints
- Public information
- Health checks
- Documentation

## API Documentation

### Live API Documentation
- **Interactive API Docs**: [http://localhost:3001/docs](http://localhost:3001/docs)
- **API Explorer**: Test endpoints directly in the browser
- **Schema Definitions**: Complete request/response schemas

### Response Format

All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message"
}
```

#### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

## Authentication

### JWT Token Authentication
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- HTTP-only cookies for security

### Permission System
- Pattern-based permissions: `{tier}.{resource}.{action}`
- Role-based access control (RBAC)
- Hierarchical permission inheritance

## Rate Limiting

All API endpoints are rate-limited:
- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute
- Platform endpoints: 5000 requests per minute

## Error Handling

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests

### Error Response Details
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "details": {
    "field": "email",
    "code": "INVALID_EMAIL",
    "message": "Please provide a valid email address"
  }
}
```

## Getting Started

1. **Start the API server**:
   ```bash
   cd apps/api && pnpm run dev
   ```

2. **Access the interactive docs**:
   Open [http://localhost:3001/docs](http://localhost:3001/docs)

3. **Test authentication**:
   ```bash
   curl -X POST http://localhost:3001/api/v1/public/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "password"}'
   ```

## Related Documentation

- [API Design Patterns](../architecture/api-design/) - Design principles and patterns
- [Authentication System](../architecture/security/authentication) - Security implementation
- [Development Guide](../development/getting-started/) - Local development setup
- [5-Tier Architecture](../architecture/system-design/) - System architecture overview