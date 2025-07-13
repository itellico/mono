---
title: Click-dummy MCP Server
sidebar_label: Click-dummy Server
description: UI prototype exploration and pattern discovery
---

# Click-dummy MCP Server

Provides access to interactive PHP-based UI prototypes that demonstrate the complete feature set and user interface patterns for the itellico platform.

## Overview

The Click-dummy MCP server enables:
- UI prototype discovery
- Feature implementation mapping
- Component pattern exploration
- Design system reference
- User flow visualization

## Available Functions

### Search Prototypes

```javascript
mcp__click-dummy-mcp__search_click_dummy({
  query: "user profile",
  tier: "account", // optional
  feature_type: "form" // optional
});
```

**Tiers:**
- `platform` - Platform admin features
- `tenant` - Marketplace owner features
- `account` - Account management
- `user` - User-level features
- `public` - Public-facing pages

**Feature Types:**
- `dashboard` - Overview pages
- `form` - Input forms
- `table` - Data tables
- `wizard` - Multi-step processes
- `settings` - Configuration pages
- `profile` - Profile management
- `marketplace` - Marketplace features

### Get Prototype Details

```javascript
mcp__click-dummy-mcp__get_prototype_details({
  path: "platform/schemas/builder.php"
});
```

Returns:
- Full prototype metadata
- Component structure
- Implementation status
- Related documentation
- API endpoints
- Required permissions

### List Features

```javascript
mcp__click-dummy-mcp__list_prototype_features({
  tier: "tenant" // optional
});
```

### Get Implementation Map

```javascript
mcp__click-dummy-mcp__get_feature_implementation_map({
  feature: "talent-search"
});
```

Returns mapping between prototype and actual code:
- Frontend components
- API routes
- Database models
- Permission requirements

### Get UI Components

```javascript
mcp__click-dummy-mcp__get_ui_components({
  component_type: "table" // optional
});
```

**Component Types:**
- `table` - Data tables
- `form` - Form components
- `card` - Card layouts
- `modal` - Dialog boxes
- `wizard` - Step-by-step
- `media` - Media handling
- `navigation` - Nav components

## Prototype Structure

```
/click-dummy/
├── platform/          # Platform admin UI
│   ├── dashboard/    
│   ├── tenants/      
│   └── settings/     
├── tenant/           # Tenant admin UI
│   ├── marketplace/  
│   ├── accounts/     
│   └── talent/       
├── account/          # Account UI
│   ├── team/         
│   ├── projects/     
│   └── billing/      
├── user/             # User UI
│   ├── profile/      
│   ├── portfolio/    
│   └── messages/     
└── public/           # Public UI
    ├── browse/       
    ├── profiles/     
    └── login/        
```

## Metadata Format

Each prototype includes `.metadata.yaml`:

```yaml
path: tenant/talent/search.php
tier: tenant
title: Talent Search & Discovery
description: Advanced search with filters
features:
  - advanced-filters
  - saved-searches
  - bulk-actions
  - export-results
components:
  - search-bar
  - filter-sidebar
  - results-table
  - pagination
implementation_status: partial
related_docs:
  - /docs/tenant/talent-management/
api_endpoints:
  - /api/v1/tenant/talent/search
  - /api/v1/tenant/talent/filters
permissions:
  - tenant.talent.view
  - tenant.talent.search
frontend_components:
  - TalentSearchPage.tsx
  - TalentFilters.tsx
  - TalentTable.tsx
```

## Usage Examples

### Feature Implementation

```javascript
// 1. Search for prototype
const prototypes = await mcp__click-dummy-mcp__search_click_dummy({
  query: "user dashboard",
  tier: "user"
});

// 2. Get detailed info
const details = await mcp__click-dummy-mcp__get_prototype_details({
  path: prototypes[0].path
});

// 3. Get implementation map
const implementation = await mcp__click-dummy-mcp__get_feature_implementation_map({
  feature: "user-dashboard"
});

// 4. Start implementation following the prototype
```

### Component Discovery

```javascript
// Find all table components
const tables = await mcp__click-dummy-mcp__get_ui_components({
  component_type: "table"
});

// Get specific table implementation
const talentTable = tables.find(t => t.name === "TalentTable");
```

## Integration Workflow

### With Documentation Server

```javascript
// 1. Find UI prototype
const prototype = await mcp__click-dummy-mcp__search_click_dummy({
  query: "subscription management"
});

// 2. Search related docs
const docs = await mcp__docs-mcp__search_documentation({
  query: "subscription billing implementation"
});

// 3. Combine insights for implementation
```

### With Kanboard

```javascript
// 1. Find prototype
const prototype = await mcp__click-dummy-mcp__get_prototype_details({
  path: "tenant/accounts/create.php"
});

// 2. Create implementation task
await mcp__kanboard-mcp__create_task({
  title: `Implement ${prototype.title}`,
  description: `Prototype: http://192.168.178.94:4040/${prototype.path}\n\nComponents: ${prototype.components.join(', ')}`,
  tags: ["frontend", "implementation"]
});
```

## Best Practices

### 1. Prototype-First Development
- Always check prototypes before implementing
- Follow established UI patterns
- Maintain consistency with prototypes
- Update prototypes if design changes

### 2. Component Reuse
```javascript
// Check existing components first
const components = await mcp__click-dummy-mcp__get_ui_components({
  component_type: "form"
});

// Reuse patterns from prototypes
const patterns = components.filter(c => c.features.includes("validation"));
```

### 3. Permission Alignment
- Check prototype permissions
- Implement same permission structure
- Test with different user roles
- Document permission requirements

## Accessing Prototypes

### Direct Browser Access
- **URL**: http://192.168.178.94:4040/
- **Navigation**: Browse tier → feature → page
- **Interaction**: Click through user flows

### Common Prototype Paths
```
Platform Admin:
- /platform/dashboard/
- /platform/tenants/manage.php
- /platform/monitoring/system.php

Tenant Admin:
- /tenant/dashboard/
- /tenant/marketplace/settings.php
- /tenant/talent/search.php

User Features:
- /user/profile/edit.php
- /user/portfolio/gallery.php
- /user/messages/inbox.php
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Prototype not found | Check path and tier |
| Missing metadata | Some older prototypes lack metadata |
| Components undefined | Check implementation status |
| Permission errors | Verify permission names |

### Debug Tips
1. Access prototype directly in browser
2. Check console for PHP errors
3. Verify metadata file exists
4. Compare with working prototypes

## Development Workflow

1. **Discovery Phase**
   - Search relevant prototypes
   - Review UI patterns
   - Check implementation status

2. **Planning Phase**
   - Map prototype to components
   - Identify reusable patterns
   - Plan API endpoints

3. **Implementation Phase**
   - Follow prototype structure
   - Implement components
   - Connect to API

4. **Validation Phase**
   - Compare with prototype
   - Test all interactions
   - Verify permissions

## Related Documentation

- [MCP Servers Overview](./)
- [Click-dummy Structure](../CLICKDUMMY_STRUCTURE.md)
- [UI Development Guide](../../development/)