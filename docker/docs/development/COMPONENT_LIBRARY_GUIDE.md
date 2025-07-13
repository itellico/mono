# itellico Mono Component Library Guide

This guide provides a comprehensive reference for the production components and patterns used in the itellico Mono. Visit the live component library at `/dev/components` when running the development server.

## Table of Contents

1. [Overview](#overview)
2. [Standard Pages](#standard-pages)
3. [Core Components](#core-components)
4. [Common Patterns](#common-patterns)
5. [Best Practices](#best-practices)

## Overview

The itellico Mono uses a standardized set of components and patterns across all admin pages. The component library showcases actual production components that are battle-tested and follow platform conventions.

Access the component library:
```bash
npm run dev
open http://localhost:3000/dev/components
```

## Standard Pages

### Live Examples

The platform includes several standard admin pages that demonstrate best practices:

1. **Tenant Management** (`/admin/tenants`)
   - Full-featured list with stats cards
   - Advanced multi-select filters
   - Bulk actions with confirmation
   - Saved search functionality
   - Row selection and pagination

2. **User Management** (`/admin/users`)
   - Role-based filtering
   - Permission-gated actions
   - Profile management
   - Activity tracking

3. **Categories** (`/admin/categories`)
   - Hierarchical tree view
   - Drag-and-drop reordering
   - Nested category support
   - Bulk operations

4. **Audit Logs** (`/admin/audit`)
   - Time-based filtering
   - Activity type categorization
   - User tracking
   - Export capabilities

### Page Structure

All admin list pages follow this standard structure:

```tsx
<div className="space-y-6 p-8">
  {/* Page Header */}
  <div className="space-y-2">
    <h1 className="text-3xl font-bold">Page Title</h1>
    <p className="text-muted-foreground">Page description</p>
  </div>

  {/* Stats Cards Grid */}
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {statsCards.map(card => <StatsCard {...card} />)}
  </div>

  {/* Main Content: AdminListPage Component */}
  <AdminListPage
    statsCards={[]}
    addConfig={addButtonConfig}
    searchConfig={searchConfiguration}
    filters={filterConfigs}
    columns={tableColumns}
    data={tableData}
    // ... other props
  />
</div>
```

## Core Components

### AdminListPage

The cornerstone component for all admin list views. It provides:

- **Search functionality** with debouncing and suggestions
- **Multi-select filters** with active filter badges
- **Column configuration** with sorting and visibility controls
- **Row selection** with bulk actions
- **Pagination** with customizable page sizes
- **Saved searches** for frequently used filter combinations
- **Permission-based** UI elements

#### Basic Usage

```typescript
import { AdminListPage } from '@/components/admin/AdminListPage';
import type { ColumnConfig, FilterConfig } from '@/components/admin/AdminListPage';

const columns: ColumnConfig[] = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
    render: (value) => <span className="font-medium">{value}</span>
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    render: (value) => <Badge>{value}</Badge>
  }
];

const filters: FilterConfig[] = [
  {
    key: 'status',
    title: 'Status',
    type: 'multiSelect',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' }
    ]
  }
];

// Saved search configuration
const savedSearchConfig = {
  entityType: 'users',
  enabled: true,
  activeSearchName: activeSearchName,
  onLoadSearch: (config) => {
    setFilters(config.filters);
    setSortConfig(config.sortConfig);
    setColumnVisibility(config.columnVisibility);
  },
  onSaveSearch: async (searchData) => {
    await saveSavedSearch(searchData);
  },
  canSave: hasPermission('saved_searches.create'),
  canLoad: hasPermission('saved_searches.read')
};

<AdminListPage
  columns={columns}
  data={data}
  filters={filters}
  searchConfig={{
    placeholder: 'Search...',
    value: searchQuery,
    onChange: setSearchQuery
  }}
  savedSearchConfig={savedSearchConfig}
  // ... other props
/>
```

### Saved Searches

The saved searches feature allows users to save their current view configuration and quickly return to it later.

#### What Gets Saved
- Active filters and their values
- Search query
- Sort column and direction
- Column visibility settings
- Pagination limit

#### Features
- **Personal Searches**: Save searches for your own use
- **Public Searches**: Share searches with other users
- **Default Searches**: Auto-load a saved search when visiting the page
- **Permission-based**: Control who can save/load searches

#### Implementation
```typescript
const savedSearchConfig = {
  entityType: 'tenants',     // Unique identifier for this list
  enabled: true,             // Enable/disable the feature
  activeSearchName: '',      // Track currently active search
  onLoadSearch: (config) => {
    // Apply all saved settings
    setFilters(config.filters);
    setSortConfig(config.sortConfig);
    setColumnVisibility(config.columnVisibility);
    setSearchQuery(config.searchValue);
    setPaginationLimit(config.paginationLimit);
  },
  onSaveSearch: async (searchData) => {
    // Save to backend
    const response = await fetch('/api/v1/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchData)
    });
    // Handle response
  },
  canSave: userPermissions.includes('saved_searches.create'),
  canLoad: userPermissions.includes('saved_searches.read')
};
```

### ConfirmationModal

Used for all destructive actions to prevent accidental data loss.

```typescript
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';

<ConfirmationModal
  open={open}
  onOpenChange={setOpen}
  title="Delete Item"
  description="Are you sure you want to delete this item?"
  confirmText="Delete"
  variant="destructive"
  icon="delete"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

### PermissionGate

Controls UI element visibility based on user permissions.

```typescript
import { PermissionGate } from '@/components/reusable/PermissionGate';

<PermissionGate permissions={['admin', 'users.create']}>
  <Button>Admin Only Action</Button>
</PermissionGate>

<PermissionGate 
  permissions={['users.edit']}
  fallback={<Alert>You don't have permission</Alert>}
>
  <EditForm />
</PermissionGate>
```

### Stats Cards

Display key metrics at the top of admin pages.

```typescript
const statsCards = [
  {
    title: 'Total Users',
    value: 1234,
    description: 'Active platform users'
  },
  {
    title: 'Revenue',
    value: '$45,231',
    description: '+12% from last month'
  }
];

<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {statsCards.map((card, index) => (
    <Card key={index}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{card.value}</div>
        <p className="text-xs text-muted-foreground">{card.description}</p>
      </CardContent>
    </Card>
  ))}
</div>
```

## Common Patterns

### List Page Pattern

```typescript
export default function UsersPage() {
  const [filters, setFilters] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const { data, isLoading } = useQuery(['users', filters]);

  return (
    <div className="space-y-6 p-8">
      <PageHeader title="Users" description="Manage platform users" />
      <StatsCards cards={statsData} />
      <AdminListPage
        data={data}
        columns={columns}
        filters={filterConfigs}
        selectedRows={selectedRows}
        onRowSelect={handleRowSelect}
        bulkActions={bulkActions}
        // ... other props
      />
    </div>
  );
}
```

### Edit Page Pattern

```typescript
export default function EditUserPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Edit User" description="Update user details" />
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            {/* Form fields */}
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

### Loading States

Use skeleton components for consistent loading states:

```typescript
// Table loading
<div className="space-y-2">
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
  <Skeleton className="h-10 w-full" />
</div>

// Card loading
<Card>
  <CardHeader className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-3 w-[300px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-20 w-full" />
  </CardContent>
</Card>
```

## Best Practices

### 1. Always Use AdminListPage for Lists
The `AdminListPage` component handles all the complex functionality needed for admin lists:
- Filtering and search
- Sorting and pagination
- Row selection and bulk actions
- Permission checks
- Saved searches

### 2. Include Stats Cards
Show key metrics at the top of list pages to give users quick insights into the data.

### 3. Implement Permission Gates
Always wrap sensitive UI elements in `PermissionGate` components to ensure proper access control.

### 4. Use Confirmation Modals
All destructive actions should require confirmation to prevent accidental data loss.

### 5. Provide Feedback
- Show loading states during data fetching
- Display success/error messages for user actions
- Include empty states with helpful messages

### 6. Follow Naming Conventions
- Pages: `*Page.tsx`
- Components: `*Component.tsx` or descriptive names
- Hooks: `use*`
- Utils: lowercase with hyphens

### 7. Maintain Consistency
- Use the same spacing patterns (p-8 for page padding, space-y-6 for sections)
- Follow the established color scheme and variants
- Keep interaction patterns consistent across pages

## Testing Components

When building new features, always check the component library first:

1. Visit `/dev/components` to see available components
2. Check live examples in `/admin/*` pages
3. Review the patterns in existing code
4. Reuse components instead of creating duplicates

## Migration Guide

When updating existing pages to use standard components:

1. **Identify the page type** (list, edit, detail)
2. **Review the corresponding pattern** in the component library
3. **Replace custom implementations** with standard components
4. **Test all functionality** including permissions and edge cases
5. **Update any custom styling** to match platform standards

## Resources

- **Component Library**: http://localhost:3000/dev/components
- **Live Examples**: See `/admin/*` pages for production usage
- **UI Components**: ShadCN UI library documentation
- **Icons**: Lucide React icon set