# Three-Level Change System Implementation Guide

## Overview

The Three-Level Change System provides sophisticated change tracking and conflict resolution for the itellico Mono. It combines optimistic updates, server-side processing, and persistent storage to deliver a seamless user experience.

## Quick Start

### 1. Wrap Your App with the Provider

```tsx
import { ThreeLevelChangeProvider } from '@/components/changes';

function App() {
  return (
    <ThreeLevelChangeProvider showNotifications={true}>
      {/* Your app components */}
    </ThreeLevelChangeProvider>
  );
}
```

### 2. Use the Hook for Mutations

```tsx
import { useThreeLevelChange } from '@/hooks/useThreeLevelChange';

function ProductEditor({ productId }) {
  const { data: product } = useQuery(['products', productId], fetchProduct);
  
  const { mutate, isLoading } = useThreeLevelChange({
    entityType: 'products',
    entityId: productId,
    optimisticUpdate: (old, changes) => ({ ...old, ...changes }),
    requireApproval: changes => changes.price < product.price * 0.5,
  });

  const handleSave = (formData) => {
    mutate(formData);
  };
}
```

### 3. Show Change Status

```tsx
import { ChangeIndicator } from '@/components/changes';

function ProductCard({ product }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <h3>{product.name}</h3>
          <ChangeIndicator 
            entityType="products" 
            entityId={product.id}
            showDetails 
          />
        </div>
      </CardHeader>
    </Card>
  );
}
```

## Core Concepts

### Level 1: Optimistic Updates
- **When**: Immediately when user makes changes
- **Where**: Client-side only
- **Why**: Instant feedback, better UX
- **Status**: `OPTIMISTIC`

### Level 2: Processing
- **When**: After optimistic update
- **Where**: API server
- **Why**: Business logic validation, conflict detection
- **Status**: `PROCESSING`

### Level 3: Committed
- **When**: After successful processing
- **Where**: Database
- **Why**: Permanent storage, audit trail
- **Status**: `COMMITTED`

## Key Features

### 1. Optimistic Updates

The system automatically applies changes to the UI before server confirmation:

```tsx
const { mutate } = useThreeLevelChange({
  entityType: 'products',
  entityId: productId,
  optimisticUpdate: (oldData, newData) => {
    // Return the optimistically updated data
    return { ...oldData, ...newData, updatedAt: new Date() };
  },
});
```

### 2. Conflict Detection

Conflicts are automatically detected when:
- Another user edits the same entity
- The entity was modified since you started editing
- Business rules are violated

```tsx
const { mutate } = useThreeLevelChange({
  entityType: 'products',
  entityId: productId,
  onConflict: (conflicts) => {
    // Conflicts are also handled by the global provider
    console.log('Conflicts detected:', conflicts);
  },
  conflictResolver: (current, incoming) => {
    // Optional: Auto-resolve simple conflicts
    return { ...current, ...incoming, resolvedAt: new Date() };
  },
});
```

### 3. Approval Workflows

Require approval for sensitive changes:

```tsx
const { mutate } = useThreeLevelChange({
  entityType: 'products',
  entityId: productId,
  requireApproval: (changes) => {
    // Return true if approval is needed
    return changes.price < originalPrice * 0.5; // 50% discount needs approval
  },
});
```

### 4. Change History

View complete change history with diffs:

```tsx
import { ChangeHistory } from '@/components/changes';

<ChangeHistory
  entityType="products"
  entityId={productId}
  showRollback={true}
  maxHeight="500px"
/>
```

### 5. Real-time Updates

Changes are synchronized across all connected clients:

```tsx
// Subscribe to entity updates
const { subscribeToEntity } = useChangeContext();

useEffect(() => {
  const unsubscribe = subscribeToEntity('products', productId);
  return unsubscribe;
}, [productId]);
```

## Component Reference

### ChangeIndicator

Shows the current status of changes for an entity:

```tsx
<ChangeIndicator
  entityType="products"
  entityId={productId}
  showDetails={true}      // Show text labels
  size="md"               // sm | md | lg
  className="custom-class"
/>
```

### ChangeHistory

Displays full change history with rollback options:

```tsx
<ChangeHistory
  entityType="products"
  entityId={productId}
  showRollback={true}     // Enable rollback buttons
  maxHeight="500px"       // Scrollable height
/>
```

### ConflictResolver

Handles conflict resolution (usually shown automatically):

```tsx
<ConflictResolver
  isOpen={showConflicts}
  onClose={() => setShowConflicts(false)}
  conflicts={conflicts}
  currentValues={current}
  incomingValues={incoming}
  onResolve={handleResolve}
/>
```

### DiffViewer

Shows differences between two versions:

```tsx
<DiffViewer
  oldValues={previousVersion}
  newValues={currentVersion}
  maxHeight="300px"
/>

// Or side-by-side view
<SideBySideDiffViewer
  oldValues={previousVersion}
  newValues={currentVersion}
/>
```

## Hook Reference

### useThreeLevelChange

Main hook for mutations with change tracking:

```tsx
const {
  mutate,        // Function to trigger changes
  mutateAsync,   // Async version returning promise
  isLoading,     // Is mutation in progress
  error,         // Error object if failed
  isSuccess,     // Was mutation successful
  data,          // Response data
  reset,         // Reset mutation state
} = useThreeLevelChange({
  entityType: string,
  entityId: string,
  optimisticUpdate?: (old, new) => merged,
  conflictResolver?: (current, incoming) => resolved,
  requireApproval?: boolean | (changes) => boolean,
  onConflict?: (conflicts) => void,
  mutationOptions?: TanStackQueryOptions,
});
```

### useChangeHistory

Fetch change history for an entity:

```tsx
const { data, isLoading, error } = useChangeHistory(
  entityType,
  entityId,
  {
    includeRollbacks: boolean,
    limit: number,
    offset: number,
  }
);
```

### useChangeApproval

Approve or reject pending changes:

```tsx
const { approve, reject, isApproving, isRejecting } = useChangeApproval();

// Approve a change
approve({ 
  changeSetId: 'abc123',
  applyImmediately: true 
});

// Reject a change
reject({ 
  changeSetId: 'abc123',
  reason: 'Price too low' 
});
```

### useChangeRollback

Rollback applied changes:

```tsx
const { mutate: rollback, isPending } = useChangeRollback();

rollback(changeSetId);
```

## API Endpoints

### Change Management

```
POST   /api/v1/changes                     Create change set
GET    /api/v1/changes/:id                 Get change details
GET    /api/v1/changes/:type/:id/history   Get entity history
POST   /api/v1/changes/:id/approve         Approve change
POST   /api/v1/changes/:id/reject          Reject change
POST   /api/v1/changes/:id/rollback        Rollback change
PATCH  /api/v1/changes/:type/:id           Apply changes with tracking
```

### Conflict Resolution

```
POST   /api/v1/changes/conflicts/:id/resolve   Resolve conflict
```

### Pending Changes

```
GET    /api/v1/changes/pending             List pending changes
GET    /api/v1/changes/user/:userId        Get user's changes
```

## Best Practices

### 1. Always Include Version Information

```tsx
const changes = {
  ...formData,
  _version: entity.updatedAt, // Include for stale data detection
};
```

### 2. Handle Loading States

```tsx
<Button disabled={isLoading || !hasChanges}>
  {isLoading ? 'Saving...' : 'Save Changes'}
</Button>
```

### 3. Provide Clear Conflict Messages

```tsx
onConflict: (conflicts) => {
  const message = conflicts.some(c => c.type === 'STALE_DATA')
    ? 'Your data is out of date. Please refresh and try again.'
    : 'Another user is editing this item. Please resolve conflicts.';
  
  toast.error(message);
}
```

### 4. Use Approval Workflows Wisely

```tsx
requireApproval: (changes) => {
  // Only require approval for significant changes
  const needsApproval = 
    changes.price < original.price * 0.5 || // 50% discount
    changes.quantity > 1000 ||               // Large quantity
    changes.status === 'discontinued';       // Status change
    
  return needsApproval;
}
```

### 5. Implement Proper Error Handling

```tsx
const { mutate } = useThreeLevelChange({
  entityType: 'products',
  entityId: productId,
  mutationOptions: {
    onError: (error) => {
      if (error.response?.status === 409) {
        // Conflict - handled by onConflict
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to make this change');
      } else {
        toast.error('Failed to save changes. Please try again.');
      }
    },
  },
});
```

## WebSocket Events

The system uses WebSocket for real-time updates:

### Events Sent by Server

```typescript
// Change created
{ type: 'CHANGE_CREATED', data: ChangeSet }

// Change status updated
{ type: 'CHANGE_UPDATED', data: ChangeSet }

// Change committed to database
{ type: 'CHANGE_COMMITTED', data: ChangeSet }

// Change rejected
{ type: 'CHANGE_REJECTED', data: ChangeSet }

// Conflict detected
{ type: 'CONFLICT_DETECTED', data: Conflict }

// Entity updated by another user
{ type: 'ENTITY_UPDATED', data: { entityType, entityId, changes } }
```

### Subscribing to Events

```tsx
const { subscribe, unsubscribe } = useWebSocket();

// Subscribe to all changes
const unsub1 = subscribe('changes', (message) => {
  console.log('Change event:', message);
});

// Subscribe to specific entity
const unsub2 = subscribe(`entity:products:${productId}`, (message) => {
  console.log('Product updated:', message);
});

// Cleanup
useEffect(() => {
  return () => {
    unsub1();
    unsub2();
  };
}, []);
```

## Troubleshooting

### Changes Not Appearing

1. Check WebSocket connection
2. Verify entity type and ID match
3. Ensure provider is wrapped around component
4. Check for console errors

### Conflicts Not Resolving

1. Ensure conflict resolution completes
2. Check for validation errors
3. Verify user has permission
4. Look for server-side errors

### Performance Issues

1. Limit change history queries
2. Use pagination for large histories
3. Debounce rapid changes
4. Optimize optimistic updates

## Migration Guide

To add three-level changes to existing entities:

1. **Update API endpoint** to use change tracking:
   ```typescript
   // Before
   fastify.patch('/products/:id', handler);
   
   // After
   fastify.patch('/products/:id', {
     preHandler: [authenticate, authorize(['products:update'])],
   }, handler);
   ```

2. **Replace mutations** with useThreeLevelChange:
   ```tsx
   // Before
   const mutation = useMutation(updateProduct);
   
   // After
   const { mutate } = useThreeLevelChange({
     entityType: 'products',
     entityId: productId,
   });
   ```

3. **Add change indicators** to UI:
   ```tsx
   <ChangeIndicator entityType="products" entityId={id} />
   ```

4. **Enable history** viewing:
   ```tsx
   <ChangeHistory entityType="products" entityId={id} />
   ```

## Security Considerations

1. **Tenant Isolation**: Changes are automatically scoped to user's tenant
2. **Permission Checks**: API validates user can make changes
3. **Audit Trail**: All changes are logged with user attribution
4. **Conflict Prevention**: Optimistic locking prevents overwrites
5. **Approval Workflows**: Sensitive changes require authorization

## Performance Tips

1. **Cache Change History**: Use staleTime in queries
2. **Batch Updates**: Group related changes
3. **Debounce Saves**: Prevent rapid successive saves
4. **Optimize Diffs**: Only send changed fields
5. **Lazy Load History**: Load on demand, not by default