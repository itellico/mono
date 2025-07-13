# Page Builder Architecture - Complete Integration Plan

## Overview

The Page Builder system fundamentally changes how the platform works - from static Next.js routes to a dynamic CMS where tenants create pages that pull data from schemas and option sets.

## 🏗️ Architecture Components

### 1. Dynamic Routing in Next.js

```typescript
// apps/web/src/app/[tenant]/[[...slug]]/page.tsx
export default async function DynamicPage({ params }) {
  const { tenant, slug } = params;
  
  // 1. Resolve tenant
  const tenantData = await getTenant(tenant);
  if (!tenantData) return notFound();
  
  // 2. Resolve page
  const page = await getPageBySlug(tenantData.id, slug || ['home']);
  if (!page) return notFound();
  
  // 3. Render page with widgets
  return <PageRenderer page={page} tenant={tenantData} />;
}
```

### 2. Page Storage Structure

```sql
-- Pages table
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  slug VARCHAR(255),
  title VARCHAR(255),
  status ENUM('draft', 'published', 'scheduled'),
  template VARCHAR(100),
  meta_title VARCHAR(160),
  meta_description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP,
  UNIQUE KEY unique_tenant_slug (tenant_id, slug)
);

-- Page sections/widgets
CREATE TABLE page_sections (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  position INTEGER,
  widget_type VARCHAR(100), -- 'model-grid', 'model-filter', etc.
  configuration JSON,
  styles JSON,
  created_at TIMESTAMP
);

-- Widget configurations store:
{
  "widget_type": "model-grid",
  "data_source": {
    "schema": "fashion_model",      // Which model schema to use
    "filters": {
      "gender": "female",
      "status": "active"
    },
    "limit": 12,
    "sort": "created_at_desc"
  },
  "display": {
    "columns": 3,
    "fields": ["name", "height", "age", "location"],
    "image_aspect": "portrait",
    "enable_quickview": true
  },
  "option_sets": {
    "height": "height_cm",          // Which option set for height
    "location": "cities_worldwide"  // Which option set for location
  }
}
```

### 3. Widget-Schema Integration

```typescript
// Widget Registry
const WIDGET_REGISTRY = {
  'model-grid': {
    component: ModelGridWidget,
    allowedSchemas: ['fashion_model', 'commercial_model', 'fitness_model'],
    requiredPermissions: ['models.list'],
    configSchema: ModelGridConfigSchema
  },
  'model-filter': {
    component: ModelFilterWidget,
    allowedSchemas: ['fashion_model', 'commercial_model'],
    requiredPermissions: ['models.search'],
    configSchema: ModelFilterConfigSchema
  },
  'registration-form': {
    component: RegistrationFormWidget,
    allowedSchemas: ['model_application'],
    requiredPermissions: ['applications.create'],
    configSchema: RegistrationFormConfigSchema
  }
};

// Widget Data Fetching
async function ModelGridWidget({ config, tenant }) {
  // 1. Get the schema definition
  const schema = await getModelSchema(tenant.id, config.data_source.schema);
  
  // 2. Build query based on schema fields
  const query = buildQuery(schema, config.data_source.filters);
  
  // 3. Fetch data
  const models = await fetchModels(tenant.id, query);
  
  // 4. Get option sets for display
  const optionSets = await getOptionSets(Object.values(config.option_sets));
  
  // 5. Render with data
  return <ModelGrid models={models} config={config} optionSets={optionSets} />;
}
```

### 4. Industry Template Integration

```typescript
// Industry templates define available widgets and schemas
const MODELING_AGENCY_TEMPLATE = {
  id: 'modeling-agency',
  name: 'Modeling Agency',
  
  // Available model schemas for this industry
  schemas: [
    'fashion_model',
    'commercial_model', 
    'child_model',
    'plus_size_model'
  ],
  
  // Available widgets
  widgets: [
    'model-grid',
    'model-carousel',
    'model-search',
    'model-filter',
    'casting-list',
    'registration-form',
    'contact-form'
  ],
  
  // Default pages
  defaultPages: [
    {
      slug: 'models',
      title: 'Our Models',
      sections: [
        {
          widget: 'model-filter',
          config: {
            data_source: { schema: 'fashion_model' },
            filters: ['gender', 'height', 'hair_color', 'eye_color']
          }
        },
        {
          widget: 'model-grid',
          config: {
            data_source: { schema: 'fashion_model' },
            display: { columns: 4, fields: ['name', 'height'] }
          }
        }
      ]
    }
  ],
  
  // Widget restrictions
  widgetRestrictions: {
    'model-grid': {
      maxPerPage: 3,
      allowedSchemas: ['fashion_model', 'commercial_model']
    }
  }
};
```

### 5. Complete Data Flow

```
1. User visits: gomodels.com/our-talents
   ↓
2. Next.js catch-all route matches [tenant='gomodels'][slug='our-talents']
   ↓
3. System queries: SELECT * FROM pages WHERE tenant_id = ? AND slug = ?
   ↓
4. Retrieves page configuration with widget definitions
   ↓
5. For each widget:
   - Load widget component
   - Fetch schema definition
   - Query data based on schema + filters
   - Load required option sets
   - Render with live data
   ↓
6. Return complete rendered page
```

### 6. API Structure for Widget Data

```typescript
// API endpoint for widget data
// POST /api/v1/tenant/widgets/data
{
  "widget_type": "model-grid",
  "configuration": {
    "data_source": {
      "schema": "fashion_model",
      "filters": {
        "gender": "female",
        "min_height": 170
      }
    }
  }
}

// Response includes schema-aware data
{
  "data": {
    "items": [
      {
        "id": "123",
        "name": "Jane Doe",
        "height": {
          "value": 175,
          "display": "175 cm / 5'9\"",  // Regional conversion
          "option_set": "height_cm"
        },
        "fields": { /* all schema fields */ }
      }
    ],
    "schema": {
      "name": "fashion_model",
      "fields": { /* field definitions */ }
    },
    "option_sets": {
      "height_cm": { /* option set data */ }
    }
  }
}
```

### 7. Form Widget Integration

```typescript
// Registration form pulls from model schema
const RegistrationFormWidget = ({ config }) => {
  // Get schema for form fields
  const schema = useModelSchema(config.schema);
  const optionSets = useOptionSets(schema.optionSets);
  
  return (
    <DynamicForm
      schema={schema}
      optionSets={optionSets}
      onSubmit={handleSubmit}
    />
  );
};

// Form automatically generates fields based on schema
// - Height dropdown from height_cm option set
// - Multi-select for languages from languages option set
// - Regional conversion for measurements
```

### 8. Caching Strategy

```typescript
// Three-layer caching for dynamic pages
const PageCache = {
  // 1. CDN/Edge caching for published pages
  edge: {
    'tenant:gomodels:page:models': {
      ttl: 300, // 5 minutes
      tags: ['gomodels', 'page', 'models']
    }
  },
  
  // 2. Redis for widget data
  redis: {
    'widget:model-grid:fashion:female': {
      ttl: 60, // 1 minute for frequently changing data
      data: { /* cached query results */ }
    }
  },
  
  // 3. React Query for client-side
  client: {
    queryKey: ['widget', 'model-grid', filters],
    staleTime: 30000 // 30 seconds
  }
};
```

### 9. Migration Strategy

```typescript
// Phase 1: Dual routing
// - Keep existing Next.js routes
// - Add dynamic routes for new pages

// Phase 2: Widget library
// - Build all widgets with schema integration
// - Test with sample data

// Phase 3: Page builder rollout
// - Enable for new pages only
// - Migrate existing pages gradually

// Phase 4: Full dynamic
// - All pages through page builder
// - Remove static routes
```

### 10. Example: Model Filter Widget

```typescript
const ModelFilterWidget: React.FC<WidgetProps> = ({ config, onFilterChange }) => {
  const schema = useModelSchema(config.data_source.schema);
  const [filters, setFilters] = useState({});
  
  // Build filter UI from schema + option sets
  const filterFields = config.display.filters.map(fieldName => {
    const field = schema.fields[fieldName];
    const optionSet = field.optionSet ? 
      useOptionSet(field.optionSet) : null;
    
    switch(field.type) {
      case 'select':
        return (
          <Select
            key={fieldName}
            label={field.label}
            options={optionSet?.values || field.options}
            onChange={value => updateFilter(fieldName, value)}
          />
        );
        
      case 'range':
        return (
          <RangeSlider
            key={fieldName}
            label={field.label}
            min={field.min}
            max={field.max}
            onChange={value => updateFilter(fieldName, value)}
          />
        );
    }
  });
  
  return <div className="model-filters">{filterFields}</div>;
};
```

## Implementation Priorities

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Database schema for pages and widgets
- [ ] Next.js dynamic routing setup
- [ ] Basic page renderer component
- [ ] Widget registry system

### Phase 2: Widget Development (Week 3-4)
- [ ] Model Grid widget with schema integration
- [ ] Model Filter widget with option sets
- [ ] Form widgets pulling from schemas
- [ ] Content widgets (heading, text, image)

### Phase 3: Page Builder UI (Week 5-6)
- [ ] Complete visual editor
- [ ] Widget configuration panels
- [ ] Preview system
- [ ] Publishing workflow

### Phase 4: Integration (Week 7-8)
- [ ] Connect to existing model schemas
- [ ] Option set integration
- [ ] Industry template support
- [ ] Permission system

### Phase 5: Migration (Week 9-10)
- [ ] Migrate existing pages
- [ ] Update documentation
- [ ] Training materials
- [ ] Performance optimization

## Critical Decisions Needed

1. **URL Structure**: 
   - Subdomain: `gomodels.mono.com/models`
   - Path-based: `mono.com/gomodels/models`

2. **Preview System**:
   - Separate preview URLs?
   - Draft token system?

3. **Versioning**:
   - Page version history?
   - Widget version compatibility?

4. **Performance**:
   - Static generation for published pages?
   - ISR (Incremental Static Regeneration)?

5. **Multi-language**:
   - Separate pages per language?
   - Or translation layer?

This architecture provides a complete dynamic page system that integrates with your existing schemas and option sets while maintaining the flexibility tenants need.