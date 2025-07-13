# Saved Searches Inheritance Design

## Overview

The itellico Mono implements a hierarchical saved searches system that allows searches to be inherited across different organizational levels, providing flexibility and consistency across the platform.

## Architecture

### Search Hierarchy Levels

```
┌─────────────────────────────────────┐
│     System/Global Searches          │ ← Created by Super Admins
│   (Available to all tenants)        │   Can be templates or enforced
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Tenant-level Searches          │ ← Created by Tenant Admins
│  (Available to all tenant users)    │   Can override global searches
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       User-level Searches           │ ← Created by Individual Users
│    (Private or shared in tenant)    │   Personal customizations
└─────────────────────────────────────┘
```

### Database Schema Enhancement

```sql
-- Enhanced SavedSearch model
model SavedSearch {
  id              Int                  @id @default(autoincrement())
  uuid            String               @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  
  -- Hierarchical ownership
  userId          Int?                 // NULL for tenant/system searches
  tenantId        Int?                 // NULL for system searches
  scope           SavedSearchScope     @default(USER)
  
  -- Inheritance
  parentSearchId  Int?                 // Reference to parent search
  isInherited     Boolean              @default(false)
  canOverride     Boolean              @default(true)
  
  -- Core fields
  name            String               @db.VarChar(255)
  description     String?
  entityType      String               @db.VarChar(50)
  filters         Json
  sortConfig      Json?                // {column, direction}
  columnConfig    Json?                // Column visibility
  searchValue     String?
  paginationLimit Int?
  
  -- Visibility & Status
  isDefault       Boolean              @default(false)
  isPublic        Boolean              @default(false)
  isTemplate      Boolean              @default(false)
  isActive        Boolean              @default(true)
  
  -- Metadata
  createdBy       Int                  // User who created it
  createdAt       DateTime             @default(now())
  updatedAt       DateTime             @updatedAt
  
  -- Relations
  user            User?                @relation(fields: [userId], references: [id])
  tenant          Tenant?              @relation(fields: [tenantId], references: [id])
  parentSearch    SavedSearch?         @relation("SearchInheritance", fields: [parentSearchId], references: [id])
  childSearches   SavedSearch[]        @relation("SearchInheritance")
  creator         User                 @relation("SearchCreator", fields: [createdBy], references: [id])
  
  @@index([scope, entityType, tenantId])
  @@index([userId, entityType, isActive])
  @@index([parentSearchId])
}

enum SavedSearchScope {
  SYSTEM    // Global, created by super admins
  TENANT    // Tenant-wide, created by tenant admins
  USER      // User-specific
}
```

## Implementation Details

### 1. Search Resolution Logic

When fetching saved searches for a user:

```typescript
async function getAvailableSavedSearches(
  userId: number,
  tenantId: number,
  entityType: string
): Promise<SavedSearch[]> {
  const searches = await db.savedSearch.findMany({
    where: {
      entityType,
      isActive: true,
      OR: [
        // System searches (available to all)
        { scope: 'SYSTEM' },
        // Tenant searches for this tenant
        { scope: 'TENANT', tenantId },
        // User's own searches
        { scope: 'USER', userId },
        // Public searches from same tenant
        { scope: 'USER', tenantId, isPublic: true }
      ]
    },
    orderBy: [
      { scope: 'asc' }, // System first, then tenant, then user
      { isDefault: 'desc' },
      { name: 'asc' }
    ]
  });

  // Apply inheritance and override logic
  return applyInheritanceRules(searches);
}
```

### 2. Inheritance Rules

1. **System searches** can be:
   - **Templates**: Users can copy and customize
   - **Enforced**: Cannot be modified, always appear
   - **Overrideable**: Tenants can create modified versions

2. **Tenant searches** can:
   - Override system searches (if allowed)
   - Be mandatory for all tenant users
   - Serve as templates for user customization

3. **User searches** can:
   - Override tenant/system searches (if allowed)
   - Be shared with other tenant users
   - Be promoted to tenant level by admins

### 3. Permission Model

```typescript
const SAVED_SEARCH_PERMISSIONS = {
  // System level
  'saved_searches.create.system': 'Create system-wide searches',
  'saved_searches.manage.system': 'Manage all system searches',
  
  // Tenant level
  'saved_searches.create.tenant': 'Create tenant-wide searches',
  'saved_searches.manage.tenant': 'Manage tenant searches',
  'saved_searches.promote.tenant': 'Promote user searches to tenant',
  
  // User level
  'saved_searches.create.own': 'Create personal searches',
  'saved_searches.share.tenant': 'Share searches with tenant',
  'saved_searches.manage.own': 'Manage own searches'
};
```

### 4. API Endpoints

```typescript
// Get all available searches (with inheritance)
GET /api/v1/saved-searches
  ?entityType=categories
  &includeInherited=true
  &scope=all|system|tenant|user

// Create search at specific scope
POST /api/v1/saved-searches
{
  scope: "TENANT", // or "SYSTEM", "USER"
  name: "Active Categories",
  entityType: "categories",
  filters: {...},
  isTemplate: true,
  canOverride: true
}

// Override an inherited search
POST /api/v1/saved-searches/:id/override
{
  modifications: {
    filters: {...},
    name: "Active Categories (Custom)"
  }
}

// Promote user search to tenant level
POST /api/v1/saved-searches/:id/promote
{
  scope: "TENANT"
}
```

### 5. UI Components

#### SavedSearchDropdown Enhancement
```tsx
<SavedSearchDropdown>
  <DropdownMenuGroup>
    <DropdownMenuLabel>System Searches</DropdownMenuLabel>
    {systemSearches.map(search => (
      <DropdownMenuItem key={search.id}>
        <Shield className="mr-2 h-4 w-4" />
        {search.name}
        {search.isEnforced && <Lock className="ml-2 h-3 w-3" />}
      </DropdownMenuItem>
    ))}
  </DropdownMenuGroup>
  
  <DropdownMenuSeparator />
  
  <DropdownMenuGroup>
    <DropdownMenuLabel>Organization Searches</DropdownMenuLabel>
    {tenantSearches.map(search => (
      <DropdownMenuItem key={search.id}>
        <Building className="mr-2 h-4 w-4" />
        {search.name}
      </DropdownMenuItem>
    ))}
  </DropdownMenuGroup>
  
  <DropdownMenuSeparator />
  
  <DropdownMenuGroup>
    <DropdownMenuLabel>My Searches</DropdownMenuLabel>
    {userSearches.map(search => (
      <DropdownMenuItem key={search.id}>
        <User className="mr-2 h-4 w-4" />
        {search.name}
        {search.isPublic && <Users className="ml-2 h-3 w-3" />}
      </DropdownMenuItem>
    ))}
  </DropdownMenuGroup>
</SavedSearchDropdown>
```

### 6. Caching Strategy

```typescript
// Redis cache keys with scope
const CACHE_KEYS = {
  SYSTEM: 'saved_searches:system:{entityType}',
  TENANT: 'saved_searches:tenant:{tenantId}:{entityType}',
  USER: 'saved_searches:user:{userId}:{entityType}',
  RESOLVED: 'saved_searches:resolved:{userId}:{tenantId}:{entityType}'
};

// Cache invalidation on changes
async function invalidateSavedSearchCache(search: SavedSearch) {
  const keys = [];
  
  switch (search.scope) {
    case 'SYSTEM':
      // Invalidate all tenant and user caches
      keys.push('saved_searches:*');
      break;
    case 'TENANT':
      // Invalidate tenant and user caches
      keys.push(`saved_searches:tenant:${search.tenantId}:*`);
      keys.push(`saved_searches:user:*:${search.entityType}`);
      break;
    case 'USER':
      // Invalidate specific user cache
      keys.push(`saved_searches:user:${search.userId}:*`);
      break;
  }
  
  await cache.invalidatePattern(keys);
}
```

## Benefits

1. **Consistency**: System-wide searches ensure consistent filtering across tenants
2. **Flexibility**: Tenants can customize while maintaining base functionality
3. **Discoverability**: Users benefit from pre-configured searches
4. **Governance**: Admins can enforce certain search patterns
5. **Scalability**: Hierarchical structure reduces duplication

## Migration Path

1. Add new columns to existing SavedSearch table
2. Migrate existing searches to USER scope
3. Create default system searches for common patterns
4. Update API to support scope parameter
5. Enhance UI components with hierarchy visualization
6. Add admin interfaces for system/tenant search management

## Security Considerations

1. **Scope Validation**: Ensure users can only create searches at allowed scopes
2. **Tenant Isolation**: Maintain strict tenant boundaries
3. **Override Protection**: Respect canOverride flags
4. **Audit Trail**: Log all search modifications and promotions