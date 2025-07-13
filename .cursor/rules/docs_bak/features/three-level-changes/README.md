# Three-Level Change System

## Overview

The Three-Level Change System is a sophisticated change tracking and conflict resolution system that provides:

- **Optimistic Updates** - Instant UI feedback
- **Server Processing** - Business logic validation
- **Database Persistence** - Complete audit trail
- **Conflict Resolution** - Automatic and manual options
- **Real-time Sync** - WebSocket-based updates
- **Approval Workflows** - For sensitive changes

## Documentation

- [Architecture Document](../../architecture/THREE_LEVEL_CHANGE_SYSTEM.md) - Technical design and implementation details
- [Implementation Guide](../THREE_LEVEL_CHANGE_SYSTEM_GUIDE.md) - How to use the system in your code

## Quick Example

```tsx
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';
import { ChangeIndicator } from '@/components/changes';

function ProductEditor({ productId }) {
  const { mutate, isLoading } = useThreeLevelChange({
    entityType: 'products',
    entityId: productId,
    optimisticUpdate: (old, changes) => ({ ...old, ...changes }),
  });

  return (
    <div>
      <ChangeIndicator entityType="products" entityId={productId} />
      <form onSubmit={(e) => {
        e.preventDefault();
        mutate(formData);
      }}>
        {/* Form fields */}
      </form>
    </div>
  );
}
```

## Key Benefits

1. **Better UX** - Users see changes immediately
2. **Data Integrity** - Conflicts are detected and resolved
3. **Audit Trail** - Complete history of all changes
4. **Scalability** - Works with multiple concurrent users
5. **Flexibility** - Customizable for different entity types