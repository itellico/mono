---
title: Audit System Guide
category: features
tags:
  - audit
  - compliance
  - change-tracking
  - monitoring
  - security
priority: high
lastUpdated: '2025-07-06'
---

# Audit System Guide

## Overview

Enterprise-grade audit system with advanced change tracking, user activity monitoring, and real-time conflict resolution for compliance and security.

**System Status: ✅ Production-Ready (9/10)**

## Core Features

### System Architecture
1. **Audit Logging** - System-wide event tracking
2. **User Activity Tracking** - Frontend interaction monitoring
3. **Three-Level Change System** - Optimistic → Processing → Committed workflow
4. **Version History** - Complete entity snapshots for rollback
5. **Record Locking** - Concurrent editing protection
6. **Permission Auditing** - Security and compliance tracking

### Key Benefits
- Complete tenant isolation
- Performance optimized with Redis caching
- Enterprise compliance (SOX, GDPR, HIPAA)
- Concurrent editing protection
- Real-time activity tracking

**Implementation**: See `src/lib/services/audit.service.ts`

## Database Schema

### Core Tables
- `audit_logs` - System events and entity changes
- `user_activity_logs` - Frontend user interactions
- `change_sets` - Three-level change tracking
- `change_conflicts` - Conflict detection and resolution
- `version_history` - Complete entity snapshots
- `record_locks` - Pessimistic locking
- `permission_audit` - RBAC security auditing

**Schema**: See `prisma/schema.prisma`

## Quick Start

### Admin Dashboard
Access: `http://localhost:3000/admin/audit`
Required Permission: `audit.read.global`

**Dashboard**: See `src/app/admin/audit/page.tsx`

### API Integration
Basic audit logging and entity trail retrieval for system events and changes.

**Service**: See `src/lib/services/audit.service.ts`

### Frontend Tracking
Activity tracking hooks for user interactions and form submissions.

**Hooks**: See `src/hooks/useAuditTracking.ts`

## API Endpoints

### 5-Tier Architecture
```
/api/v1/public/audit/*       # Public audit endpoints
/api/v1/user/audit/*         # User audit access
/api/v1/account/audit/*      # Account audit management
/api/v1/tenant/audit/*       # Tenant audit administration
/api/v1/platform/audit/*     # Platform audit operations
```

### Key Endpoints
- Audit log filtering and pagination
- Entity change history
- Dashboard statistics
- Export functionality (CSV/JSON)
- Change approval workflow
- Conflict resolution

**API Routes**: See `apps/api/src/routes/v1/*/audit/`

## Three-Level Change System

### Change Levels
1. **OPTIMISTIC** - Immediate UI updates for responsiveness
2. **PROCESSING** - Server-side validation and conflict detection
3. **COMMITTED** - Permanently applied to database

### Conflict Types
- Concurrent editing
- Stale data detection
- Validation failures
- Permission conflicts
- Business rule violations

### Resolution Strategies
- Accept current state
- Apply incoming changes
- Merge both changes
- Manual intervention
- Retry operations

**Implementation**: See `src/hooks/useThreeLevelChange.ts`

## Admin Dashboard Features

### Audit Log Viewer
- Advanced filtering by date, user, action, entity
- Real-time updates with auto-refresh
- Detailed expandable log entries
- Export options (CSV, JSON)
- Full-text search capabilities

### User Activity Analytics
- Engagement metrics and session analysis
- Feature usage tracking
- Performance insights and error rates
- Trend analysis over time

### Permission Auditing
- Access pattern tracking
- Permission change monitoring
- Security event logging
- Compliance reporting

### Version History Browser
- Complete entity timeline
- Visual diff comparisons
- One-click rollback capability
- Change dependency tracking

**Components**: See `src/components/admin/audit/`

## Security & Compliance

### Data Protection
- Automatic PII masking
- Sensitive data encryption
- Configurable retention policies
- GDPR anonymization support

### Access Control
Permission-based audit access with granular controls:
- `audit.read.own` - View own logs
- `audit.read.tenant` - View tenant logs
- `audit.read.global` - View all logs
- `audit.create` - Create entries
- `audit.export` - Export data
- `audit.delete` - Cleanup operations

### Compliance Standards
- SOC 2 Type II ready
- GDPR compliant
- HIPAA ready
- PCI DSS support

**Security**: See `src/lib/permissions/audit-permissions.ts`

## Performance Optimization

### Three-Layer Caching
1. **Redis** - Hot data (5min TTL)
2. **Application** - Computed results (15min TTL)
3. **Database** - Cold storage with indexes

### Database Optimization
Optimized indexes for common query patterns:
- Tenant/time composite indexes
- Entity-specific indexes
- User activity indexes
- Change status indexes

**Cache Implementation**: See `src/lib/cache/audit-cache.ts`

## Development Guide

### Adding Audit Events
- Define audit action types
- Log events with context
- Include metadata and changes

### Custom Activity Tracking
- Track user interactions
- Monitor feature usage
- Capture performance metrics

### Extending Change Tracking
- Entity-specific validation
- Custom approval rules
- Business logic integration

**Development Guide**: See `docs/development/audit-integration.md`

## Monitoring & Metrics

### System Metrics
- Logs per second generation rate
- Cache hit rate efficiency
- Database query performance
- Conflict and rollback rates

### User Metrics
- Daily active users
- Session duration analysis
- Feature adoption tracking
- Error rate monitoring

### Health Checks
System health endpoint with database, Redis, and audit log status monitoring.

**Health Endpoint**: `/api/v1/audit/health`

## Troubleshooting

### Common Issues
1. **High Cache Miss Rate** - Optimize cache keys and TTL settings
2. **Slow Audit Queries** - Add composite indexes for frequent queries
3. **Change Conflicts** - Implement optimistic locking strategies

### Debug Mode
Environment variable and service-level debugging options available.

**Debug Tools**: See `src/lib/debug/audit-debugger.ts`

## Compliance Features

- Complete audit trail for data access
- Automated compliance checking
- Data anonymization capabilities
- Right to be forgotten support
- Healthcare and payment data tracking