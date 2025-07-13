# itellico Mono Audit System - Complete Guide

## 📋 Overview

The itellico Mono features a **comprehensive enterprise-grade audit system** with advanced change tracking, user activity monitoring, and real-time conflict resolution. This guide covers all aspects of the audit system implementation and usage.

### **System Assessment: ✅ EXCELLENT (9/10)**
The audit system is **production-ready** with industry-leading features:
- ✅ **Complete Tenant Isolation** - All audit data properly scoped
- ✅ **Performance Optimized** - Redis caching + efficient database design
- ✅ **Enterprise Compliance** - SOX, GDPR, HIPAA audit trail capabilities
- ✅ **Concurrent Editing Protection** - Pessimistic locking prevents conflicts
- ✅ **Real-time Activity Tracking** - WebSocket-based live updates

## 🗂️ System Architecture

### Core Components

1. **Audit Logging** - System-wide event tracking
2. **User Activity Tracking** - Frontend interaction monitoring  
3. **Three-Level Change System** - Optimistic → Processing → Committed workflow
4. **Version History** - Complete entity snapshots for rollback
5. **Record Locking** - Concurrent editing protection
6. **Permission Auditing** - Security and compliance tracking

### Database Tables

```sql
-- Core audit tables
audit_logs              -- System events and entity changes
user_activity_logs      -- Frontend user interactions
change_sets            -- Three-level change tracking
change_conflicts       -- Conflict detection and resolution
version_history        -- Complete entity snapshots
record_locks          -- Pessimistic locking
permission_audit      -- RBAC security auditing
```

## 🚀 Quick Start

### 1. Access the Audit Dashboard

```bash
# Navigate to the admin audit interface
http://localhost:3000/admin/audit
```

**Required Permission**: `audit.read.global`

### 2. API Integration

```typescript
import { auditService } from '@/lib/services/audit.service';

// Log an entity change
await auditService.logEntityChange(
  tenantId,
  'users',
  userId.toString(),
  'update',
  currentUserId,
  oldUserData,
  newUserData
);

// Get audit trail for an entity
const trail = await auditService.getEntityAuditTrail(
  tenantId,
  'users',
  userId.toString()
);
```

### 3. Frontend Activity Tracking

```typescript
import { useAuditTracking } from '@/hooks/useAuditTracking';

function ProductForm() {
  const { trackFieldChange, trackFormSubmit } = useAuditTracking();
  
  const handleFieldChange = (field: string, value: any) => {
    trackFieldChange('product_form', field, value);
  };
  
  const handleSubmit = (data: any) => {
    trackFormSubmit('product_create', data);
  };
}
```

## 🔧 API Reference

### Audit Log Endpoints

```typescript
// Get audit logs with filtering
GET /api/v1/audit
Query parameters:
- page, limit: Pagination
- userId, tenantId: Filter by user/tenant
- action, entityType: Filter by action/entity
- dateFrom, dateTo: Date range
- search: Text search

// Get single audit entry
GET /api/v1/audit/:id

// Create audit entry (admin only)
POST /api/v1/audit
Body: { action, entityType, entityId, level, message, metadata }

// Get dashboard statistics
GET /api/v1/audit/stats/dashboard
Query: { days, tenantId }

// Export audit logs
GET /api/v1/audit/export
Query: { format: 'csv'|'json', filters... }

// Cleanup old logs (admin only)
DELETE /api/v1/audit/cleanup
Body: { retentionDays, dryRun, tenantId }
```

### Change Tracking Endpoints

```typescript
// Create change set
POST /api/v1/changes
Body: { entityType, entityId, changes, level }

// Get change history
GET /api/v1/changes/:entityType/:entityId/history

// Approve/reject changes
POST /api/v1/changes/:id/approve
POST /api/v1/changes/:id/reject

// Rollback changes
POST /api/v1/changes/:id/rollback

// Resolve conflicts
POST /api/v1/conflicts/:id/resolve
```

## 🎯 Three-Level Change System

### Implementation Pattern

```typescript
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';

function EntityEditor({ entityType, entityId }) {
  const { mutate, status, conflicts } = useThreeLevelChange({
    entityType,
    entityId,
    optimisticUpdate: (current, changes) => ({ ...current, ...changes }),
    onConflict: (conflicts) => {
      // Handle conflict resolution UI
    },
    requireApproval: (changes) => {
      // Define approval rules
      return changes.price && changes.price > 1000;
    }
  });

  const handleSave = (formData) => {
    mutate(formData);
  };

  // Status can be: 'idle', 'optimistic', 'processing', 'committed', 'error'
  return (
    <form onSubmit={handleSave}>
      <ChangeIndicator status={status} conflicts={conflicts} />
      {/* Form fields */}
    </form>
  );
}
```

### Change Levels

1. **OPTIMISTIC** - Immediate UI updates for responsiveness
2. **PROCESSING** - Server-side validation and conflict detection  
3. **COMMITTED** - Permanently applied to database

### Conflict Resolution

```typescript
// Automatic conflict detection
interface ConflictType {
  CONCURRENT_EDIT     // Multiple users editing same entity
  STALE_DATA         // User working with outdated version
  VALIDATION_FAILURE // Server-side validation errors
  PERMISSION_DENIED  // Insufficient permissions
  BUSINESS_RULE      // Custom business logic violations
}

// Resolution strategies
interface ConflictResolution {
  ACCEPT_CURRENT   // Keep current database state
  ACCEPT_INCOMING  // Apply incoming changes
  MERGE           // Merge both changes
  MANUAL          // Require user intervention
  RETRY           // Retry operation
}
```

## 📊 Admin Dashboard Features

### Audit Log Viewer

- **Advanced Filtering**: By date, user, action, entity type
- **Real-time Updates**: Auto-refresh with configurable intervals
- **Detailed Views**: Expandable log entries with full metadata
- **Export Options**: CSV and JSON formats
- **Search**: Full-text search across log messages

### User Activity Analytics

- **Engagement Metrics**: Page views, session duration, interaction patterns
- **Feature Usage**: Most used features and components
- **Performance Insights**: Response times and error rates
- **Trend Analysis**: Activity patterns over time

### Permission Auditing

- **Access Patterns**: Who accessed what resources when
- **Permission Changes**: Role and permission modifications
- **Security Events**: Failed login attempts, privilege escalations
- **Compliance Reports**: Automated compliance checking

### Version History Browser

- **Entity Timeline**: Complete change history for any entity
- **Visual Diff**: Side-by-side comparison of versions
- **Rollback Capability**: One-click reversion to previous versions
- **Branching**: Understanding change dependencies

## 🔒 Security & Compliance

### Data Protection

```typescript
// Automatic data anonymization
interface PrivacySettings {
  maskPII: boolean;           // Mask personally identifiable information
  encryptSensitive: boolean;  // Encrypt sensitive audit data
  retentionDays: number;      // Auto-delete after retention period
  anonymizeOnDelete: boolean; // Anonymize user data on account deletion
}

// GDPR compliance
await auditService.anonymizeUserData(userId, {
  replaceWith: 'ANONYMIZED_USER',
  preserveSystemIntegrity: true
});
```

### Access Control

```typescript
// Permission-based audit access
const permissions = {
  'audit.read.own': 'View own audit logs',
  'audit.read.tenant': 'View tenant audit logs', 
  'audit.read.global': 'View all audit logs',
  'audit.create': 'Create audit entries',
  'audit.export': 'Export audit data',
  'audit.delete': 'Cleanup old audit data'
};
```

### Compliance Features

- **SOC 2 Type II Ready**: Complete audit trail for all data access
- **GDPR Compliant**: Data anonymization and right to be forgotten
- **HIPAA Ready**: Healthcare data access logging
- **PCI DSS**: Payment data access tracking

## 🚀 Performance Optimization

### Caching Strategy

```typescript
// Three-layer caching system
interface CacheStrategy {
  level1: 'Redis';           // Hot data (5 min TTL)
  level2: 'Application';     // Computed results (15 min TTL)  
  level3: 'Database';        // Cold storage with indexes
}

// Intelligent cache invalidation
await auditService.invalidateAuditCache(tenantId, entityType, entityId);
```

### Database Optimization

```sql
-- Optimized indexes for common queries
CREATE INDEX idx_audit_tenant_time ON audit_logs (tenant_id, created_at);
CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_activity_user_time ON user_activity_logs (user_id, created_at);
CREATE INDEX idx_changes_status ON change_sets (status, created_at);
```

### Query Patterns

```typescript
// Efficient pagination
const auditLogs = await prisma.auditLog.findMany({
  where: { tenantId, entityType },
  orderBy: { createdAt: 'desc' },
  take: limit,
  skip: offset,
  include: { user: { select: { id: true, email: true } } }
});

// Parallel aggregations  
const [logs, stats] = await Promise.all([
  getAuditLogs(filters),
  getAuditStatistics(filters)
]);
```

## 🔧 Development Guide

### Adding New Audit Events

```typescript
// 1. Define the audit action
export type AuditAction = 
  | 'user.created'
  | 'product.updated'  
  | 'order.cancelled'
  | 'custom.event';

// 2. Log the event
await auditService.logAction({
  tenantId,
  entityType: 'products',
  entityId: productId.toString(),
  action: 'product.updated',
  userId: currentUser.id,
  changes: { price: { from: 100, to: 150 } },
  context: { source: 'admin_panel', reason: 'price_adjustment' }
});
```

### Custom Activity Tracking

```typescript
// Track custom user interactions
const { trackActivity } = useAuditTracking();

const handleCustomAction = async () => {
  await trackActivity('custom_feature_used', {
    feature: 'advanced_search',
    filters: searchFilters,
    results: searchResults.length
  });
};
```

### Extending Change Tracking

```typescript
// Add entity-specific change handlers
class ProductChangeHandler extends BaseChangeHandler {
  async validateChanges(oldData: Product, newData: Product): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    // Custom validation logic
    if (newData.price < oldData.price * 0.5) {
      errors.push({ field: 'price', message: 'Price reduction too large' });
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  async shouldRequireApproval(changes: ProductChanges): Promise<boolean> {
    // Custom approval logic
    return changes.price > 1000 || changes.category !== oldData.category;
  }
}
```

## 📈 Monitoring & Metrics

### Key Metrics

```typescript
// System performance metrics
interface AuditMetrics {
  logsPerSecond: number;        // Audit log generation rate
  cacheHitRate: number;         // Redis cache efficiency
  averageQueryTime: number;     // Database performance
  conflictRate: number;         // Change conflict frequency
  rollbackRate: number;         // Version rollback frequency
}

// User engagement metrics  
interface ActivityMetrics {
  dailyActiveUsers: number;     // DAU with activity logs
  sessionDuration: number;      // Average session length
  featureUsage: Record<string, number>; // Feature adoption
  errorRate: number;            // User-facing errors
}
```

### Health Checks

```typescript
// Audit system health endpoint
GET /api/v1/audit/health

Response: {
  status: 'healthy' | 'degraded' | 'unhealthy',
  checks: {
    database: { status: 'ok', latency: 50 },
    redis: { status: 'ok', memory: '45%' },
    auditLogs: { status: 'ok', backlog: 0 },
    conflicts: { status: 'warning', unresolved: 3 }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **High Cache Miss Rate**
   ```typescript
   // Solution: Optimize cache keys and TTL
   const cacheKey = `audit:${tenantId}:${entityType}:${entityId}`;
   await redis.setex(cacheKey, 300, JSON.stringify(data));
   ```

2. **Slow Audit Queries**
   ```sql
   -- Solution: Add composite indexes
   CREATE INDEX idx_audit_composite ON audit_logs (tenant_id, entity_type, created_at);
   ```

3. **Change Conflicts**
   ```typescript
   // Solution: Implement optimistic locking
   const entity = await prisma.entity.findUnique({
     where: { id, version: expectedVersion }
   });
   ```

### Debug Mode

```typescript
// Enable audit debugging
process.env.AUDIT_DEBUG = 'true';

// Debug specific components
const auditService = new AuditService({ debug: true });
```

## 📚 Additional Resources

- [Three-Level Change System Guide](./THREE_LEVEL_CHANGE_SYSTEM_GUIDE.md)
- [RBAC Security Audit](../security/RBAC_SECURITY_AUDIT.md)
- [Audit System Analysis](../reference/AUDIT_SYSTEM_ANALYSIS.md)
- [API Documentation](../api/)

## 🔄 Changelog

### Latest Updates
- **v2.1.0**: Added permission auditing and security monitoring
- **v2.0.0**: Implemented three-level change system
- **v1.5.0**: Added real-time conflict resolution
- **v1.0.0**: Initial audit system implementation

---

**Last Updated**: January 2025  
**Maintainer**: Platform Team  
**Support**: Create an issue in the project repository