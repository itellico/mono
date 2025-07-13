---
title: 5-Tier API Endpoints
sidebar_label: 5-Tier Endpoints
---

# 5-Tier API Endpoints

Complete reference for all API endpoints organized by the 5-tier architecture.

## Platform Tier (`/api/v2/platform/*`)

### System Management
- `GET /api/v2/platform/system/health` - System health check
- `GET /api/v2/platform/system/metrics` - System metrics
- `POST /api/v2/platform/system/maintenance` - Enable maintenance mode

### Tenant Management
- `GET /api/v2/platform/tenants` - List all tenants
- `POST /api/v2/platform/tenants` - Create new tenant
- `GET /api/v2/platform/tenants/{id}` - Get tenant details
- `PUT /api/v2/platform/tenants/{id}` - Update tenant
- `DELETE /api/v2/platform/tenants/{id}` - Delete tenant

### Global Configuration
- `GET /api/v2/platform/config` - Global configuration
- `PUT /api/v2/platform/config` - Update configuration
- `GET /api/v2/platform/features` - Platform features
- `PUT /api/v2/platform/features` - Update features

## Tenant Tier (`/api/v2/tenant/*`)

### User Management
- `GET /api/v2/tenant/users` - List tenant users
- `POST /api/v2/tenant/users` - Create user
- `GET /api/v2/tenant/users/{id}` - Get user details
- `PUT /api/v2/tenant/users/{id}` - Update user
- `DELETE /api/v2/tenant/users/{id}` - Delete user

### Role Management
- `GET /api/v2/tenant/roles` - List roles
- `POST /api/v2/tenant/roles` - Create role
- `GET /api/v2/tenant/roles/{id}` - Get role details
- `PUT /api/v2/tenant/roles/{id}` - Update role
- `DELETE /api/v2/tenant/roles/{id}` - Delete role

### Permission Management
- `GET /api/v2/tenant/permissions` - List permissions
- `POST /api/v2/tenant/permissions` - Create permission
- `GET /api/v2/tenant/permissions/{id}` - Get permission details
- `PUT /api/v2/tenant/permissions/{id}` - Update permission
- `DELETE /api/v2/tenant/permissions/{id}` - Delete permission

## Account Tier (`/api/v2/account/*`)

### Account Management
- `GET /api/v2/account/profile` - Account profile
- `PUT /api/v2/account/profile` - Update profile
- `GET /api/v2/account/settings` - Account settings
- `PUT /api/v2/account/settings` - Update settings

### Team Management
- `GET /api/v2/account/members` - List team members
- `POST /api/v2/account/members` - Invite member
- `GET /api/v2/account/members/{id}` - Get member details
- `PUT /api/v2/account/members/{id}` - Update member
- `DELETE /api/v2/account/members/{id}` - Remove member

### Billing
- `GET /api/v2/account/billing` - Billing information
- `PUT /api/v2/account/billing` - Update billing
- `GET /api/v2/account/invoices` - List invoices
- `GET /api/v2/account/invoices/{id}` - Get invoice details

## User Tier (`/api/v2/user/*`)

### Profile Management
- `GET /api/v2/user/profile` - User profile
- `PUT /api/v2/user/profile` - Update profile
- `GET /api/v2/user/avatar` - User avatar
- `POST /api/v2/user/avatar` - Upload avatar
- `DELETE /api/v2/user/avatar` - Remove avatar

### Settings
- `GET /api/v2/user/settings` - User settings
- `PUT /api/v2/user/settings` - Update settings
- `GET /api/v2/user/preferences` - User preferences
- `PUT /api/v2/user/preferences` - Update preferences

### Activity
- `GET /api/v2/user/activity` - User activity log
- `GET /api/v2/user/notifications` - User notifications
- `PUT /api/v2/user/notifications/{id}` - Mark notification as read
- `DELETE /api/v2/user/notifications/{id}` - Delete notification

## Public Tier (`/api/v2/public/*`)

### Authentication
- `POST /api/v2/public/auth/login` - User login
- `POST /api/v2/public/auth/logout` - User logout
- `POST /api/v2/public/auth/refresh` - Refresh token
- `POST /api/v2/public/auth/register` - User registration
- `POST /api/v2/public/auth/forgot-password` - Forgot password
- `POST /api/v2/public/auth/reset-password` - Reset password

### Public Information
- `GET /api/v2/public/health` - Health check
- `GET /api/v2/public/version` - API version
- `GET /api/v2/public/docs` - API documentation
- `GET /api/v2/public/status` - System status

### Registration
- `POST /api/v2/public/register/tenant` - Tenant registration
- `POST /api/v2/public/register/user` - User registration
- `GET /api/v2/public/register/validate` - Validate registration token

## Standard Response Format

All endpoints return responses in this format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Endpoint-specific data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "details": {
    // Optional error details
  }
}
```

### Paginated Response
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

All endpoints except public ones require authentication via JWT tokens:

```bash
# Example authenticated request
curl -X GET http://localhost:3001/api/v2/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Rate Limiting

Rate limits by tier:
- **Public**: 100 requests/minute
- **User**: 1000 requests/minute  
- **Account**: 2000 requests/minute
- **Tenant**: 5000 requests/minute
- **Platform**: 10000 requests/minute

## Error Codes

Common error codes across all endpoints:
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid request data
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Server error

## Related Documentation

- [API Documentation](./README.md) - Complete API reference
- [Authentication Guide](../architecture/security/authentication) - Security details
- [Development Setup](../development/getting-started/) - Local development