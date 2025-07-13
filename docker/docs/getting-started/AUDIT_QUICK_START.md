# Audit System Quick Start Guide

## 🚀 Getting Started with itellico Mono Audit System

This guide will get you up and running with the audit system in 5 minutes.

## ✅ Prerequisites

- Admin access to itellico Mono
- Permission: `audit.read.global` or `audit.read.tenant`
- Development environment running (see [CLAUDE.md](../../CLAUDE.md))

## 📊 Step 1: Access the Audit Dashboard

```bash
# Start your development environment (recommended: use separate terminals)

# Terminal 1: Start Fastify API server (port 3001)
./start-api.sh

# Terminal 2: Start Next.js frontend (port 3000)
./start-frontend.sh

# Alternative: Use legacy script to run both in one terminal
./start-dev.sh

# Navigate to the audit dashboard
open http://localhost:3000/admin/audit
```

**What you'll see:**
- 📋 **Overview Tab**: System status and quick metrics
- 📜 **Audit Logs Tab**: Searchable log viewer with filters
- 📚 **Versions Tab**: Entity version history browser
- 🔒 **Locks Tab**: Active record locks management
- 📈 **Analytics Tab**: User activity and system metrics

## 🔍 Step 2: View Recent Activity

### Filter Audit Logs
```bash
# In the Audit Logs tab, try these filters:
Action: "login_success"          # See user logins
Entity Type: "users"             # Filter by entity
Date Range: "Last 24 hours"     # Recent activity
User ID: "123"                   # Specific user activity
```

### Understanding Log Entries
Each audit log shows:
- **Timestamp**: When the event occurred
- **User**: Who performed the action (with avatar)
- **Action**: What happened (create, update, delete, etc.)
- **Entity**: What was affected (users, products, etc.)
- **Changes**: Before/after values for updates
- **Metadata**: Additional context (IP, user agent, etc.)

## 🎯 Step 3: Track Changes in Your Code

### Backend: Entity Changes
```typescript
// In your service/controller code
import { auditService } from '@/lib/services/audit.service';

// Automatically log entity changes
await auditService.logEntityChange(
  req.user.tenantId,    // Tenant ID
  'products',           // Entity type
  product.id.toString(), // Entity ID
  'update',             // Action
  req.user.id,          // Current user
  oldProduct,           // Previous state
  newProduct            // New state
);
```

### Frontend: User Activity
```typescript
// In your React components
import { useAuditTracking } from '@/hooks/useAuditTracking';

function ProductForm() {
  const { trackFormSubmit, trackFieldChange } = useAuditTracking();
  
  const handleSubmit = (data) => {
    trackFormSubmit('product_create', data);
    // Your form submission logic
  };
  
  const handleFieldChange = (field, value) => {
    trackFieldChange('product_form', field, value);
  };
}
```

## 🔄 Step 4: Implement Change Tracking

### Basic Three-Level Changes
```typescript
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';

function EntityEditor({ entityType, entityId }) {
  const { mutate, status, conflicts } = useThreeLevelChange({
    entityType,
    entityId,
    optimisticUpdate: (current, changes) => ({ ...current, ...changes }),
  });

  return (
    <div>
      <ChangeIndicator status={status} conflicts={conflicts} />
      <form onSubmit={(data) => mutate(data)}>
        {/* Your form */}
      </form>
    </div>
  );
}
```

### Advanced Conflict Resolution
```typescript
const { mutate } = useThreeLevelChange({
  entityType: 'products',
  entityId: productId,
  optimisticUpdate: (current, changes) => ({ ...current, ...changes }),
  onConflict: (conflicts) => {
    // Show conflict resolution UI
    setShowConflictModal(true);
    setConflicts(conflicts);
  },
  requireApproval: (changes) => {
    // Require approval for price increases > 20%
    return changes.price > product.price * 1.2;
  }
});
```

## 📤 Step 5: Export Audit Data

### Via Dashboard
1. Go to **Audit Logs** tab
2. Apply desired filters
3. Click **Export** button
4. Choose format: CSV or JSON
5. Download starts automatically

### Via API
```typescript
// Export last 30 days of audit logs
const response = await fetch('/api/v1/audit/export?format=csv&dateFrom=2025-01-01');
const csvData = await response.text();
```

## 🔒 Step 6: Monitor Security Events

### View Permission Audits
```bash
# Navigate to Analytics tab > Security section
# You'll see:
- Failed login attempts
- Permission escalations
- Access pattern anomalies
- Emergency access usage
```

### Set Up Alerts (Optional)
```typescript
// Add to your monitoring service
const securityEvents = await fetch('/api/v1/audit?action=security_*');
if (securityEvents.some(event => event.level === 'critical')) {
  // Trigger alert
}
```

## 🧪 Step 7: Test the System

### Generate Test Data
```typescript
// Create some test audit events
await auditService.logAction({
  tenantId: 1,
  entityType: 'test',
  entityId: 'demo-123',
  action: 'test_action',
  userId: req.user.id,
  changes: { status: { from: 'draft', to: 'published' } },
  context: { source: 'quick_start_guide' }
});
```

### Verify in Dashboard
1. Refresh the Audit Logs tab
2. Filter by Entity Type: "test"
3. You should see your test event

## 📋 Common Use Cases

### 1. User Login Monitoring
```bash
Filter: action="login_success" OR action="login_fail"
Purpose: Monitor authentication patterns and security
```

### 2. Data Change Tracking
```bash
Filter: action="update" AND entityType="products"
Purpose: Track product changes for inventory management
```

### 3. Admin Activity Oversight
```bash
Filter: userId=[admin_user_id]
Purpose: Monitor administrative actions
```

### 4. Compliance Reporting
```bash
Export: All logs for date range
Purpose: Generate compliance reports for auditors
```

## 🛠️ Troubleshooting

### Issue: No Audit Logs Appearing
**Solution:**
1. Check user permissions: `audit.read.global` or `audit.read.tenant`
2. Verify tenant isolation (super admins see all, others see tenant-specific)
3. Check date filters (default is last 30 days)

### Issue: Performance Issues with Large Data
**Solution:**
1. Use more specific filters (date range, entity type)
2. Reduce page size (default 25, max 100)
3. Consider exporting for bulk analysis

### Issue: Changes Not Being Tracked
**Solution:**
1. Ensure `auditService.logEntityChange()` is called in your code
2. Check if the entity type is properly configured
3. Verify database migrations are applied

## 🚀 Next Steps

Once comfortable with basics, explore:

1. **[Complete Audit System Guide](../features/AUDIT_SYSTEM_GUIDE.md)** - Comprehensive documentation
2. **[Three-Level Change System](../features/THREE_LEVEL_CHANGE_SYSTEM_GUIDE.md)** - Advanced change tracking
3. **[RBAC Security Audit](../security/RBAC_SECURITY_AUDIT.md)** - Permission system auditing
4. **[API Documentation](../api/)** - Full API reference

## 📞 Need Help?

- **Documentation**: Check `/docs` for detailed guides
- **Issues**: Create GitHub issue with audit system tag
- **Community**: Join the platform discussion forums

---

**Quick Start Complete!** 🎉

You now have a working audit system that tracks all platform activity. The system automatically logs entity changes, user interactions, and security events while providing powerful tools to view, filter, and export audit data.